import path from "path";
import fs from "fs";
// экземпляр Client
import config_amoCRM from "../config/config_amoCRM";

// принудительное обновление токена (если ранее не было запросов)
const updateConnection = async () => {
	if (!config_amoCRM.connection.isTokenExpired()) {
		return;
	}
	await config_amoCRM.connection.update();
};

const run = async () => {
	const filePath = path.resolve(__dirname, "../config/token.json");
	let renewTimeout: NodeJS.Timeout;

	config_amoCRM.token.on("change", () => {
		const token = config_amoCRM.token.getValue();
		fs.writeFileSync(filePath, JSON.stringify(token));

		// обновление токена по истечению
		const expiresIn = (token?.expires_in || 0) * 1000;

		clearTimeout(renewTimeout);
		renewTimeout = setTimeout(updateConnection, expiresIn);
	});

	try {
		const json = fs.readFileSync(filePath).toString();
		const currentToken = JSON.parse(json);
		config_amoCRM.token.setValue(currentToken);
	} catch (err) {
		console.log(`The token does not exist! ${err}`);
	}
};
