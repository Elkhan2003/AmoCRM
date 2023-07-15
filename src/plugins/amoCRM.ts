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

// ! Выполнение запроса SELECT каждую 1 минут (для поддержки соединения к базе)
setInterval(async () => {
	try {
		const { data, error } = await supabase.from("devx").select("*");

		if (error) {
			console.error(error);
			return;
		}

		console.log("Auto connection to the base (every 1 min)");
	} catch (error) {
		console.error(error);
	}
}, 1 * 60 * 1000);

// ! принудительное обновление токена (если ранее не было запросов)
const updateConnection = async () => {
	if (!config_amoCRM.connection.isTokenExpired()) {
		return;
	}
	await config_amoCRM.connection.update();
};

const run = async () => {
	// ! save auth token & refresh token V2
	let renewTimeout: NodeJS.Timeout;
	config_amoCRM.token.on("change", async () => {
		const token = config_amoCRM.token.getValue();
		try {
			const { data, error } = await supabase
				.from("devx")
				.upsert(token)
				.select();
			if (error) {
				console.log(error);
			}
		} catch (err) {
			console.log(`${err}`);
		}

		// обновление токена по истечению
		const expiresIn = (token?.expires_in ?? 0) * 1000;

		clearTimeout(renewTimeout);
		renewTimeout = setTimeout(updateConnection, expiresIn);
	});

	// ! get auth token
	try {
		const { data, error }: any = await supabase.from("devx").select().single();
		if (error) {
			console.log(error);
		} else {
			config_amoCRM.token.setValue(data);
		}
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
