import path from "path";
import fs from "fs";
import config_amoCRM from "../config/config_amoCRM";
import { createClient } from "@supabase/supabase-js";

const options = {
	auth: {
		persistSession: false
	}
};

const supabase = createClient(
	process.env.SUPABASE_URL || "",
	process.env.SUPABASE_API_KEY || "",
	options
);

// ! принудительное обновление токена (если ранее не было запросов)
const updateConnection = async () => {
	if (!config_amoCRM.connection.isTokenExpired()) {
		return;
	}
	await config_amoCRM.connection.update();
};

const run = async () => {
	const filePath = path.resolve(__dirname, "../config/token.json");

	// ! save auth token V1
	// config_amoCRM.token.on("change", () => {
	// 	const token = config_amoCRM.token.getValue();
	// 	fs.writeFileSync(filePath, JSON.stringify(token));
	// });

	// ! save auth token & refresh token V2
	// let renewTimeout: NodeJS.Timeout;

	// config_amoCRM.token.on("change", () => {
	// 	const token = config_amoCRM.token.getValue();
	// 	fs.writeFileSync(filePath, JSON.stringify(token));

	// 	// обновление токена по истечению
	// 	const expiresIn = (token?.expires_in ?? 0) * 1000;

	// 	clearTimeout(renewTimeout);
	// 	renewTimeout = setTimeout(updateConnection, expiresIn);
	// });

	// ! get auth token
	try {
		const json = fs.readFileSync(filePath).toString();
		const currentToken = JSON.parse(json);
		config_amoCRM.token.setValue(currentToken);
	} catch (err) {
		console.log(`The token does not exist! ${err}`);
	}

	// ! connect to amoCRM
	try {
		console.log("Connecting to amoCRM...");
		const status = await config_amoCRM.connection.connect();
		console.log({ status });
		console.log("Successfully connected 🦄");
	} catch (err) {
		console.log(`${err}`);
	}
};

export default run;
