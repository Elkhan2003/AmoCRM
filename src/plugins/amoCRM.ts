import { FastifyInstance } from "fastify";
import { Client } from "amocrm-js";
import fp from "fastify-plugin";

interface tokenType {
	id: number;
	token_type: string;
	expires_in: number;
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

const amoCRM = async (app: FastifyInstance) => {
	// ! config amoCRM
	const config_amoCRM = new Client({
		domain: process.env.AMOCRM_URL || "devx.amocrm.ru",
		auth: {
			client_id: process.env.AMOCRM_CLIENT_ID || "",
			client_secret: process.env.AMOCRM_CLIENT_SECRET || "",
			redirect_uri: process.env.AMOCRM_REDIRECT_URI || "",
			code: process.env.AMOCRM_CODE || "",
		},
	});

	// ! forced token update (if there were no requests earlier)
	const updateConnection = async () => {
		if (!config_amoCRM.connection.isTokenExpired()) {
			return;
		} else {
			await config_amoCRM.connection.update();
		}
	};

	// ! save token
	let renewTimeout: NodeJS.Timeout;
	// If "change" detects any modifications in the "token," it will update the token in Supabase
	config_amoCRM.token.on("change", async () => {
		const token: tokenType = config_amoCRM.token.getValue() as tokenType;
		try {
			const existingData = await app.prisma.amoCRM.findUnique({
				where: { id: 1 },
			});
			if (existingData) {
				await app.prisma.amoCRM.update({
					where: { id: 1 },
					data: token,
				});
			} else {
				await app.prisma.amoCRM.create({
					data: token,
				});
			}
		} catch (error) {
			console.log(error);
		}

		// token renewal upon expiration
		const expiresIn = (token?.expires_in ?? 0) * 1000;
		clearTimeout(renewTimeout);
		renewTimeout = setTimeout(updateConnection, expiresIn);
	});

	// ! get token
	try {
		const data = await app.prisma.amoCRM.findUnique({ where: { id: 1 } });
		if (data) {
			// Convert Decimal to number
			const tokenData: tokenType = {
				id: data.id,
				token_type: data.token_type,
				expires_in: +data.expires_in,
				access_token: data.access_token,
				refresh_token: data.refresh_token,
				expires_at: +data.expires_at,
			};

			config_amoCRM.token.setValue(tokenData);
		} else {
			console.log("The token does not exist!");
		}
	} catch (error) {
		console.log(`${error}`);
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

	app.decorate("config_amoCRM", config_amoCRM);
};

export default fp(amoCRM);
