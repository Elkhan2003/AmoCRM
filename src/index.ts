import dotenv from "dotenv";
import fastify, { FastifyInstance } from "fastify";
//@ts-ignore
import fastifyCors from "fastify-cors";
import routes from "./routes/route";

dotenv.config();

const app: FastifyInstance = fastify({
	logger: false
});

app.register(fastifyCors);
app.register(routes);

app.listen({ port: 3000 }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});
