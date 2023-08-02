"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ! Production
const controller = {
    default: async (req, res) => {
        res.status(200).send({
            message: "Hello World!",
        });
    },
    get: async (req, res) => {
        try {
            console.log("GET request...");
            const result = await req.server.client_amoCRM.request.get("/api/v4/leads");
            console.log("Successfully getting data 🏃‍♂️🏃‍♀️");
            return res.status(200).send({
                message: result.data,
            });
        }
        catch (err) {
            res.status(500).send(err);
        }
    },
    getByQuery: async (req, res) => {
        try {
            console.log("GET request with query:", req.params.query);
            const result = await req.server.client_amoCRM.request.get("/api/v4/leads", {
                query: req.params.query,
            });
            console.log("Successfully getting data 🏃‍♂️");
            return res.status(200).send({
                message: result.data,
            });
        }
        catch (err) {
            res.status(500).send(err);
        }
    },
    post: async (req, res) => {
        try {
            console.log("POST request...");
            const requestData = req.body;
            await req.server.client_amoCRM.request.post("/api/v4/leads/complex", requestData);
            console.log("Successfully created 🚀");
            return res.status(200).send({
                message: "Successfully created 🚀",
            });
        }
        catch (err) {
            res.status(500).send(err);
        }
    },
    patch: async (req, res) => {
        try {
            console.log("PATCH request...");
            const requestData = req.body;
            const result = await req.server.client_amoCRM.request.patch("/api/v4/leads", requestData);
            console.log("Successfully edited leads 🚀");
            return res.status(200).send({
                message: "Successfully edited leads 🚀",
                data: result.data,
            });
        }
        catch (err) {
            res.status(500).send(err);
        }
    },
};
exports.default = controller;
