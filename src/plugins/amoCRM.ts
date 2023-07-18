import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { Client } from "amocrm-js";

const config_amoCRM = new Client({
	domain: process.env.AMOCRM_URL || "devx.amocrm.ru",
	auth: {
		client_id: process.env.AMOCRM_CLIENT_ID || "",
		client_secret: process.env.AMOCRM_CLIENT_SECRET || "",
		redirect_uri: process.env.AMOCRM_REDIRECT_URI || "",
		code: process.env.AMOCRM_CODE || "",
	},
});

// ! executing a GET request every 3 minutes (to check the validity of the token)
// const checkToken = async () => {
// 	try {
// 		await config_amoCRM.request.get("/api/v4/leads/custom_fields");
// 	} catch (err) {
// 		console.log(`${err}`);
// 	}
// };
// setInterval(checkToken, 3 * 60 * 1000);

// ! forced token update (if there were no requests earlier)
const updateConnection = async () => {
	if (!config_amoCRM.connection.isTokenExpired()) {
		return;
	} else {
		await config_amoCRM.connection.update();
	}
};

const amoCRM = async () => {
	// ! save accessToken & refreshToken + token validity period
	let renewTimeout: NodeJS.Timeout;
	config_amoCRM.token.on("change", async () => {
		const token = config_amoCRM.token.getValue();
		try {
			// Check if the data exists in the database
			const existingData = await prisma.amoCRM.findUnique({
				where: { id: 1 },
			});

			if (existingData) {
				// If the data exists, perform the update operation
				await prisma.amoCRM.update({
					where: { id: 1 },
					//@ts-ignore
					data: token,
				});
			} else {
				// If the data does not exist, perform the create operation
				await prisma.amoCRM.create({
					//@ts-ignore
					data: token,
				});
			}
		} catch (error) {
			console.log(error);
		}

		// ! token renewal upon expiration
		const expiresIn = (token?.expires_in ?? 0) * 1000;

		clearTimeout(renewTimeout);
		renewTimeout = setTimeout(updateConnection, expiresIn);
	});

	// ! get auth token
	try {
		const data = await prisma.amoCRM.findUnique({ where: { id: 1 } });
		if (data) {
			//@ts-ignore
			config_amoCRM.token.setValue(data);
		} else {
			console.log("The token does not exist!");
		}
	} catch (error) {
		console.log(`The token does not exist! ${error}`);
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

export { amoCRM, config_amoCRM };
