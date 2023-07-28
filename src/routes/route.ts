import { FastifyInstance } from "fastify";
import { controller } from "../controllers/controller";

const routes = async (app: FastifyInstance) => {
	app.get("/", controller.default);
	app.get("/get", controller.get);
	app.get("/get/:query", controller.getByQuery);
	app.post("/post", controller.post);
	app.patch("/patch", controller.patch);
};
export default routes;
