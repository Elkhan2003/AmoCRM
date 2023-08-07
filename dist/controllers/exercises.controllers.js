"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createSubmission = async (req, res) => {
    const { user, exerciseId, status, code } = req.body;
    const amoCRM = req.server;
    const submission = await req.server.prisma.submission.upsert({
        where: {
            exerciseId,
            userId: user.id,
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
    let amoCRMStatus = "Welcome Aboard";
    if (checkExerciseStatus.length === 1) {
        amoCRMStatus = "Class 1";
    }
    else if (checkExerciseStatus.length === 2) {
        amoCRMStatus = "Class 1.1";
    }
    else if (checkExerciseStatus.length === 3) {
        amoCRMStatus = "Class 1.2";
    }
    await updateStatusToAmoCRM(amoCRM.client_amoCRM, amoCRMStatus);
    res.code(201).send({
        success: true,
        data: {
            submission,
            checkExerciseStatus,
        },
    });
};
// #### HELPER FUNCTION TO UPDATE STATUS TO AMOCRM
const updateStatusToAmoCRM = async (client_amoCRM, value) => {
    const leadData = [
        {
            id: 15215931,
            status_id: 57789982,
            custom_fields_values: [
                {
                    field_id: 683145,
                    field_name: "Free Trial Progress",
                    values: [
                        {
                            value,
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
        console.log("AMOCRM ERROR");
    }
};
exports.default = { createSubmission };
