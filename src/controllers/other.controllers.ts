import { Client } from "amocrm-js";
import { User } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";

const sendSmsCodeVerify = async (req: FastifyRequest, res: FastifyReply) => {
	const { user, phone, traffic }: any = req.body;
	const amoCRM = req.server;

	try {
		const authUser = await req.server.prisma.user.findFirst({
			where: { email: user.email },
		});
		if (!authUser) {
			await req.server.prisma.user.create({
				data: {
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					password: "",
					photo: user.photo,
					phone: phone,
					traffic: traffic,
				} as User,
			});
		}
	} catch (err) {
		console.log(`${err}`);
	}

	await addContactsToAmoCRM(
		user.firstName,
		user.lastName,
		phone,
		user.email,
		traffic,
		amoCRM.client_amoCRM
	);

	console.log("Successfully created 🚀");
	return res.status(200).send({
		message: "Successfully created 🚀",
		data: req.body,
	});
};

const checkSmsCodeVerify = async (req: FastifyRequest, res: FastifyReply) => {
	res.status(200);
};

// #### HELPER FUNCTION TO ADD CONTACTS TO AMOCRM
const addContactsToAmoCRM = async (
	first_name: string,
	last_name: string,
	phone: string,
	email: string,
	traffic: string | undefined,
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
										value: traffic,
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

export default { sendSmsCodeVerify, checkSmsCodeVerify };
