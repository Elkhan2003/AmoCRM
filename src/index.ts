import dotenv from "dotenv";
import fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import routes from "./routes/route";

dotenv.config();

const app: FastifyInstance = fastify({
	logger: false
});

app.register(fastifyCors, {
	origin: [
		'http://localhost:3000',
		'http://localhost:3001',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:3001',
		'https://wedevx.co',
		'https://app.wedevx.co',
		'https://admin.wedevx.co',
		'https://test.wedevx.co',
		'https://test.app.wedevx.co',
		'https://test.admin.wedevx.co',
		'https://test-app.wedevx.co',
		'https://test-admin.wedevx.co',
		'https://flagcdn.com/',
	],
	credentials: true,
});
app.register(routes);

app.listen({ port: 3000 }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});
