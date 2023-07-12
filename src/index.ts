import fastify, { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyCors from "@fastify/cors";
import routes from "./routes/route";

const app: FastifyInstance = fastify({
	logger: false
});

const schema = {
	type: "object",
	required: ["PORT"],
	properties: {
		PORT: {
			type: "string",
			default: 3000
		}
	}
};

const options = {
	schema: schema,
	dotenv: true
};

app.register(fastifyEnv, options);

app.register(fastifyCors, {
	origin: [
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"https://rest-api-amo-crm.vercel.app/"
	],
	credentials: true
});

app.register(routes, {
	prefix: "/"
});

app.listen({ host: "localhost", port: 3000 }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});
