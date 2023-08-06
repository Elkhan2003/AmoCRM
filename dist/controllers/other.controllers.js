"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendSmsCodeVerify = async (req, res) => {
    const { user, phone, traffic } = req.body;
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
                },
            });
        }
    }
    catch (err) {
        console.log(`${err}`);
    }
    await addContactsToAmoCRM(user.firstName, user.lastName, phone, user.email, traffic, amoCRM.client_amoCRM);
    console.log("Successfully created 🚀");
    return res.status(200).send({
        message: "Successfully created 🚀",
        data: req.body,
    });
};
const checkSmsCodeVerify = async (req, res) => {
    res.status(200);
};
// #### HELPER FUNCTION TO ADD CONTACTS TO AMOCRM
const addContactsToAmoCRM = async (first_name, last_name, phone, email, traffic, client_amoCRM) => {
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
    }
    catch (err) {
        console.log("AMOCRM ERROR");
    }
};
exports.default = { sendSmsCodeVerify, checkSmsCodeVerify };
