import { config } from "dotenv";
config();
import fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import routes from "./routes/route";

const app: FastifyInstance = fastify({
	logger: false,
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

app.register(routes, {
	prefix: "/",
});

const PORT: any = process.env.PORT;

app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});

// Создаем объект даты
let date = new Date();

// Устанавливаем часовой пояс
date.setUTCHours(date.getUTCHours() + 6);

// Получаем строку в локальном формате для Бишкека
console.log("Server started:", date.toLocaleString("ru-RU", { timeZone: "Asia/Bishkek" }), "🚀");
