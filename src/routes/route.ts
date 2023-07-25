import { FastifyInstance } from "fastify";
import Controller from "../controllers/controller";

const routes = async (app: FastifyInstance) => {
	app.get("/", Controller.default);
	app.get("/get", Controller.get);
	app.get("/get/:query", Controller.getByQuery);
	app.post("/post", Controller.post);
	app.patch("/patch", Controller.patch);
};
export default routes;
