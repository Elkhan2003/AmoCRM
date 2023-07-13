import { FastifyReply, FastifyRequest } from "fastify";
import auth_token from "../plugins/amoCRM";
auth_token();
import config_amoCRM from "../config/config_amoCRM";

const controller = {
	default: async (req: FastifyRequest, res: FastifyReply) => {
		res.status(200).send({
			message: "Hello World!"
		});
	},

	get: async (req: FastifyRequest, res: FastifyReply) => {
		try {
			console.log("GET request...");
			const result = await config_amoCRM.request.get("/api/v4/leads");

			console.log("Successfully getting data 🏃‍♂️🏃‍♀️");
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

			console.log("Successfully getting data 🏃‍♂️");
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

			console.log("Successfully created 🚀");
			return res.status(200).send({
				message: "Successfully created 🚀"
			});
		} catch (err) {
			res.status(500).send(err);
		}
	}
};

export default controller;
