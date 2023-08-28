"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createSubmission = async (req, res) => {
    const { user, exerciseId, status, code } = req.body;
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
    console.log(checkExerciseStatus.length);
    const getUserAndLeadId = async (userId) => {
        const user = await req.server.prisma.user.findFirst({
            where: {
                id: userId,
            },
        });
        if (!user) {
            return null;
        }
        const { firstName, lastName } = user;
        const getUserIdAmoCRM = await req.server.client_amoCRM.request.get("/api/v4/leads", {
            "filter[name]": `${firstName} ${lastName}`,
            "order[updated_at]": "desc",
            limit: 1,
        });
        const resultUserAmoCRM = getUserIdAmoCRM.data;
        const leadId = resultUserAmoCRM._embedded.leads[0]?.id;
        return leadId || null;
    };
    const userIdAmoCRM = await getUserAndLeadId(user.id);
    let statusId = 57789978;
    let exerciseStatus = "Welcome Aboard";
    switch (checkExerciseStatus.length) {
        case 1:
            exerciseStatus = "Class 1";
            break;
        case 2:
            exerciseStatus = "Class 1.1";
            break;
        case 3:
            exerciseStatus = "Class 1.2";
            break;
        case 4:
            exerciseStatus = "Class 2.0";
            statusId = 57789982;
            break;
        default:
            exerciseStatus = "Class 2.0";
            statusId = 57789982;
            break;
    }
    await updateExerciseStatusToAmoCRM(amoCRM.client_amoCRM, userIdAmoCRM, statusId, exerciseStatus);
    res.code(201).send({
        success: true,
        data: {
            submission,
        },
    });
};
// #### HELPER FUNCTION TO UPDATE STATUS TO AMOCRM
const updateExerciseStatusToAmoCRM = async (client_amoCRM, userIdAmoCRM, statusId, exerciseStatus) => {
    const leadData = [
        {
            id: userIdAmoCRM,
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
    }
    catch (err) {
        console.log("AMOCRM ERROR UPDATE ExerciseStatus");
    }
};
exports.default = { createSubmission };
