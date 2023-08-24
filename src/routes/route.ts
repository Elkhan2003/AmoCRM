import { FastifyInstance } from "fastify";
import controller from "../controllers/controller";
import otherControllers from "../controllers/other.controllers";
import exercisesControllers from "../controllers/exercises.controllers";

const routes = async (app: FastifyInstance) => {
	app.get("/person/:query", controller.getPerson);
	app.get("/", controller.default);
	app.get("/get", controller.get);
	app.get("/get/:name", controller.getByQuery);
	app.post("/post", controller.post);
	app.patch("/patch", controller.patch);

	// ! Test new functionality
	app.post("/api/v1/send-sms", otherControllers.sendSmsCodeVerify);
	app.post("/api/v1/check-sms", otherControllers.checkSmsCodeVerify);

	// ! Exercises
	app.post("/api/v1/submissions", exercisesControllers.createSubmission);
};
export default routes;