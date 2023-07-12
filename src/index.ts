import { config } from "dotenv";
config();
import fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import routes from "./routes/route";

const app: FastifyInstance = fastify({
	logger: false
});

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
