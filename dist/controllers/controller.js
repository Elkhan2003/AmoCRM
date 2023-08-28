"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
// Create a single supabase client for interacting with your database
const supabase = (0, supabase_js_1.createClient)("https://qmxzlkggvoqkvkccmqkn.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteHpsa2dndm9xa3ZrY2NtcWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk5Mjk0NTYsImV4cCI6MTk4NTUwNTQ1Nn0.DiksKtqMXZcmSPB3FLC2Wy_c2Gh1OFomeUhborOKePE");
// ! Production
const controller = {
    getPerson: async (req, res) => {
        try {
            console.log("GET request with query:", req.params.query);
            // const result = await req.server.prisma.user.findMany({
            // 	where: {
            // 		firstName: req.params.query,
            // 	},
            // });
            const { data, error } = await supabase
                .from("User")
                .select("*")
                .eq("firstName", req.params.query);
            console.log("Successfully getting data 🏃‍♂️");
            return res.status(200).send({
                message: data,
            });
        }
        catch (err) {
            res.status(500).send(err);
        }
    },
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
            console.log("GET request with query:", req.params.name);
            const result = await req.server.client_amoCRM.request.get("/api/v4/leads", {
                "filter[name]": req.params.name,
                "order[updated_at]": "desc",
                limit: 1,
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
