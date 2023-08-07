import { Client } from "amocrm-js";
import { FastifyReply, FastifyRequest } from "fastify";

const createSubmission = async (req: FastifyRequest, res: FastifyReply) => {
	const { user, exerciseId, status, code }: any = req.body;
	const amoCRM = req.server;

	const submission = await req.server.prisma.submission.upsert({
		where: {
			exerciseId_userId: {
				exerciseId,
				userId: user.id,
			},
		},
		create: {
			userId: user.id,
			exerciseId,
			status,
			code,
		},
		update: {
			status,
			code,
		},
	});

	const checkExerciseStatus = await req.server.prisma.submission.findMany({
		where: {
			userId: user.id,
			status: "SOLVED",
		},
	});

	let statusId = 57789978;
	let exerciseStatus = "Welcome Aboard";

	if (checkExerciseStatus.length === 1) {
		exerciseStatus = "Class 1";
	} else if (checkExerciseStatus.length === 2) {
		exerciseStatus = "Class 1.1";
	} else if (checkExerciseStatus.length === 3) {
		exerciseStatus = "Class 1.2";
	} else if (checkExerciseStatus.length === 4) {
		exerciseStatus = "Class 2.0";
	}

	if (exerciseStatus === "Class 2.0") {
		statusId = 57789982;
	}

	await updateStatusToAmoCRM(amoCRM.client_amoCRM, statusId, exerciseStatus);

	res.code(201).send({
		success: true,
		data: {
			submission,
			checkExerciseStatus,
		},
	});
};

// #### HELPER FUNCTION TO UPDATE STATUS TO AMOCRM
const updateStatusToAmoCRM = async (
	client_amoCRM: Client,
	statusId: number,
	exerciseStatus: string
) => {
	const leadData = [
		{
			id: 15215931,
			status_id: statusId,
			custom_fields_values: [
				{
					field_id: 683145,
					field_name: "Free Trial Progress",
					values: [
						{
							value: exerciseStatus,
						},
					],
				},
			],
		},
	];

	try {
		await client_amoCRM.request.patch("/api/v4/leads", leadData);
	} catch (err) {
		console.log("AMOCRM ERROR");
	}
};
export default { createSubmission };
