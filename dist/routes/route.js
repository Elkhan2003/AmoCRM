"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = __importDefault(require("../controllers/controller"));
const other_controllers_1 = __importDefault(require("../controllers/other.controllers"));
const exercises_controllers_1 = __importDefault(require("../controllers/exercises.controllers"));
const routes = async (app) => {
    app.get("/person/:query", controller_1.default.getPerson);
    app.get("/", controller_1.default.default);
    app.get("/get", controller_1.default.get);
    app.get("/get/:name", controller_1.default.getByQuery);
    app.post("/post", controller_1.default.post);
    app.patch("/patch", controller_1.default.patch);
    // ! Test new functionality
    app.post("/api/v1/send-sms", other_controllers_1.default.sendSmsCodeVerify);
    app.post("/api/v1/check-sms", other_controllers_1.default.checkSmsCodeVerify);
    // ! Exercises
    app.post("/api/v1/submissions", exercises_controllers_1.default.createSubmission);
};
exports.default = routes;
