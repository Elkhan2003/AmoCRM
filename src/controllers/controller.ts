import config_amoCRM from "../config/config_amoCRM";
import path from "path";
import fs from "fs";
import { FastifyReply, FastifyRequest } from "fastify";
const filePath = path.resolve(__dirname, "../config/token.json");

(async () => {
	// ! save auth token
	// config_amoCRM.token.on("change", () => {
	// 	const token = config_amoCRM.token.getValue();
	// 	fs.writeFileSync(filePath, JSON.stringify(token));
	// });

	// ! get auth token
	if (fs.existsSync(filePath)) {
		const json = fs.readFileSync(filePath).toString();
		const current_token = JSON.parse(json);
		config_amoCRM.token.setValue(current_token);
	} else {
		console.log(`The token does not exist!`);
	}

	// ! connect to amoCRM
	try {
		console.log("Connecting to amoCRM...");
		const status = await config_amoCRM.connection.connect();
		console.log({ status });
		console.log("Successfully connected");
	} catch (err) {
		console.log(`${err}`);
	}
})();

const controller = {
	get: async (req: FastifyRequest, res: FastifyReply) => {
		try {
			console.log("GET request...");
			const result = await config_amoCRM.request.get("/api/v4/leads");

			console.log("Successfully getting data ❤️");
			return res.status(200).send({
				message: result.data
			});
		} catch (err) {
			res.status(500).send(err);
		}
	},

	getByQuery: async (
		req: FastifyRequest<{ Params: { query: string } }>,
		res: FastifyReply
	) => {
		try {
			console.log("GET request with query:", req.params.query);
			const result = await config_amoCRM.request.get("/api/v4/leads", {
				query: req.params.query
			});

			console.log("Successfully getting data ❤️");
			return res.status(200).send({
				message: result.data
			});
		} catch (err) {
			res.status(500).send(err);
		}
	},

	post: async (req: FastifyRequest, res: FastifyReply) => {
		try {
			console.log("POST request...");
			const requestData: any = req.body;
			await config_amoCRM.request.post("/api/v4/leads/complex", requestData);

			console.log("Successfully created ❤️");
			return res.status(200).send({
				message: "Successfully created ❤️"
			});
		} catch (err) {
			res.status(500).send(err);
		}
	}
};

export default controller;
