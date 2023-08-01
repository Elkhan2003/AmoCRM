import { FastifyInstance } from "fastify";
import controller from "../controllers/controller";
// import otherControllers from "../controllers/other.controllers";

const routes = async (app: FastifyInstance) => {
	app.get("/", controller.default);
	app.get("/get", controller.get);
	app.get("/get/:query", controller.getByQuery);
	app.post("/post", controller.post);
	app.patch("/patch", controller.patch);
};
export default routes;
