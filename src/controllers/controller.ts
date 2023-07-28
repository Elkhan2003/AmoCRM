import { Client } from "amocrm-js";
import { FastifyReply, FastifyRequest } from "fastify";

// ! Production
const controller = {
	default: async (req: FastifyRequest, res: FastifyReply) => {
		res.status(200).send({
			message: "Hello World!",
		});
	},

	get: async (req: FastifyRequest, res: FastifyReply) => {
		try {
			console.log("GET request...");
			const result = await req.server.client_amoCRM.request.get(
				"/api/v4/leads"
			);

			console.log("Successfully getting data 🏃‍♂️🏃‍♀️");
			return res.status(200).send({
				message: result.data,
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
			const result = await req.server.client_amoCRM.request.get(
				"/api/v4/leads",
				{
					query: req.params.query,
				}
			);

			console.log("Successfully getting data 🏃‍♂️");
			return res.status(200).send({
				message: result.data,
			});
		} catch (err) {
			res.status(500).send(err);
		}
	},

	post: async (req: FastifyRequest, res: FastifyReply) => {
		try {
			console.log("POST request...");
			const requestData: any = req.body;
			await req.server.client_amoCRM.request.post(
				"/api/v4/leads/complex",
				requestData
			);

			console.log("Successfully created 🚀");
			return res.status(200).send({
				message: "Successfully created 🚀",
			});
		} catch (err) {
			res.status(500).send(err);
		}
	},

	patch: async (req: FastifyRequest, res: FastifyReply) => {
		try {
			console.log("PATCH request...");
			const requestData: any = req.body;
			const result = await req.server.client_amoCRM.request.patch(
				"/api/v4/leads",
				requestData
			);
			console.log("Successfully edited leads 🚀");
			return res.status(200).send({
				message: "Successfully edited leads 🚀",
				data: result.data,
			});
		} catch (err) {
			res.status(500).send(err);
		}
	},
};

// ! Test new functionality
// #### HELPER FUNCTION TO ADD CONTACTS TO AMOCRM
const addContactsToAmoCRM = async (
	first_name: string,
	last_name: string,
	phone: string,
	email: string,
	client_amoCRM: Client
) => {
	// Should Not Run In Local Environment To Maintain Refresh Token History
	// if (process.env.mode !== 'live') return true;

	const leadData = [
		{
			status_id: 57686042,
			name: first_name + " " + last_name,
			custom_fields_values: [
				{
					field_id: 683145,
					field_name: "Free Trial Progress",
					values: [
						{
							enum_id: 498591,
							value: "Not Started",
						},
					],
				},
			],
			_embedded: {
				tags: [
					{
						name: "freeusers",
					},
				],
				contacts: [
					{
						first_name: first_name,
						last_name: last_name,
						custom_fields_values: [
							{
								field_code: "PHONE",
								values: [
									{
										enum_code: "WORK",
										value: phone,
									},
								],
							},
							{
								field_code: "EMAIL",
								values: [
									{
										enum_code: "WORK",
										value: email,
									},
								],
							},
							{
								field_id: 638609,
								field_name: "lead source option",
								values: [
									{
										value: "GitHub",
									},
								],
							},
						],
					},
				],
			},
		},
	];

	try {
		await client_amoCRM.request.post("/api/v4/leads/complex", leadData);
	} catch (err) {
		console.log("AMOCRM ERROR");
	}
};

export { controller, addContactsToAmoCRM };
