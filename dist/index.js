"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const route_1 = __importDefault(require("./routes/route"));
const prisma_1 = __importDefault(require("./plugins/prisma"));
const amoCRM_1 = __importDefault(require("./plugins/amoCRM"));
const start = async () => {
    const server = (0, fastify_1.default)({
        logger: false,
    });
    server.register(cors_1.default, {
        origin: [
            "http://localhost:3000",
            "http://localhost:5000",
            "http://127.0.0.1:5000",
            "https://amocrm-production.up.railway.app",
            "https://wedevx.vercel.app",
            "https://amocrm911.vercel.app",
        ],
        credentials: true,
    });
    server.register(prisma_1.default);
    server.register(amoCRM_1.default);
    server.register(route_1.default, {
        prefix: "/",
    });
    const PORT = process.env.PORT || 3000;
    try {
        const address = await server.listen({
            port: PORT,
            host: "0.0.0.0",
        });
        console.log(`${new Date()}`);
        console.log("server running at: " + address);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
    return server;
};
start();
