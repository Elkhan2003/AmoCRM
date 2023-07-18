import { config } from "dotenv";
config();
import fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import routes from "./routes/route";
import { amoCRM } from "./plugins/amoCRM";

const app: FastifyInstance = fastify({
	logger: false,
});

const timeZone = new Date().toLocaleString("ru-RU", {
	timeZone: "Asia/Bishkek",
});

app.register(fastifyCors, {
	origin: [
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"https://rest-api-amo-crm.vercel.app",
		"https://rest-api-amocrm-production.up.railway.app",
		"https://server-production-374b.up.railway.app",
	],
	credentials: true,
});

app.register(amoCRM);

app.register(routes, {
	prefix: "/",
});

const PORT: any = process.env.PORT;

app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	console.log("Server started:", timeZone, "🚀");
});

export { timeZone };
