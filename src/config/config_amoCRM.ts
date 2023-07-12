import { config } from "dotenv";
config();
import { Client } from "amocrm-js";

const config_amoCRM = new Client({
	domain: process.env.AMOCRM_URL || "",
	auth: {
		client_id: process.env.AMOCRM_CLIENT_ID || "",
		client_secret: process.env.AMOCRM_CLIENT_SECRET || "",
		redirect_uri: process.env.AMOCRM_REDIRECT_URI || "",
		code: process.env.AMOCRM_CODE || ""
	}
});

export default config_amoCRM;
