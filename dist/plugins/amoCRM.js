"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amocrm_js_1 = require("amocrm-js");
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const amoCRM = async (app) => {
    // ! config amoCRM
    const client_amoCRM = new amocrm_js_1.Client({
        domain: process.env.AMOCRM_URL,
        auth: {
            client_id: process.env.AMOCRM_CLIENT_ID,
            client_secret: process.env.AMOCRM_CLIENT_SECRET,
            redirect_uri: process.env.AMOCRM_REDIRECT_URI,
            code: process.env.AMOCRM_CODE,
        },
    });
    // ! forced token update (if there were no requests earlier)
    const updateConnection = async () => {
        if (!client_amoCRM.connection.isTokenExpired()) {
            return;
        }
        else {
            await client_amoCRM.connection.update();
        }
    };
    // ! save token
    let renewTimeout;
    // If "change" detects any modifications in the "token," it will update the token in Supabase
    client_amoCRM.token.on("change", async () => {
        const token = client_amoCRM.token.getValue();
        const tokenConvert = {
            tokenType: token.token_type,
            expiresIn: token.expires_in,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: token.expires_at,
        };
        try {
            const existingData = await app.prisma.amoCRM.findUnique({
                where: { id: 1 },
            });
            if (existingData) {
                await app.prisma.amoCRM.update({
                    where: { id: 1 },
                    data: tokenConvert,
                });
            }
            else {
                await app.prisma.amoCRM.create({
                    data: tokenConvert,
                });
            }
        }
        catch (error) {
            console.log(error);
        }
        // token renewal upon expiration
        const expiresIn = (token?.expires_in ?? 0) * 1000;
        clearTimeout(renewTimeout);
        renewTimeout = setTimeout(updateConnection, expiresIn);
    });
    // ! get token
    try {
        const data = await app.prisma.amoCRM.findUnique({ where: { id: 1 } });
        if (data) {
            // Convert Decimal to number
            const tokenData = {
                token_type: data.tokenType,
                expires_in: +data.expiresIn,
                access_token: data.accessToken,
                refresh_token: data.refreshToken,
                expires_at: +data.expiresAt,
            };
            client_amoCRM.token.setValue(tokenData);
        }
        else {
            console.log("The token does not exist!");
        }
    }
    catch (error) {
        console.log(`${error}`);
    }
    // ! connect to amoCRM
    try {
        console.log("Connecting to amoCRM...");
        const status = await client_amoCRM.connection.connect();
        console.log({ status });
        console.log("Successfully connected 🦄");
    }
    catch (err) {
        console.log(`${err}`);
    }
    app.decorate("client_amoCRM", client_amoCRM);
};
exports.default = (0, fastify_plugin_1.default)(amoCRM);
