import { config } from "dotenv";
config();
import fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import routes from "./routes/route";
import prisma from "./plugins/prisma";
import { PrismaClient } from "@prisma/client";
import amoCRM from "./plugins/amoCRM";
import { Client } from "amocrm-js";

declare module "fastify" {
	interface FastifyInstance {
		prisma: PrismaClient;
		client_amoCRM: Client;
	}
}

const start = async () => {
	const server: FastifyInstance = fastify({
		logger: false,
	});

	server.register(fastifyCors, {
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

	server.register(prisma);
	server.register(amoCRM);

	server.register(routes, {
		prefix: "/",
	});

	const PORT: any = process.env.PORT || 3000;

	try {
		const address = await server.listen({
			port: PORT,
			host: "0.0.0.0",
		});

		console.log(`${new Date()}`);
		console.log("server running at: " + address);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}

	return server;
};
start();
