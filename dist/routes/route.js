"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = __importDefault(require("../controllers/controller"));
const other_controllers_1 = __importDefault(require("../controllers/other.controllers"));
const routes = async (app) => {
    app.get("/", controller_1.default.default);
    app.get("/get", controller_1.default.get);
    app.get("/get/:query", controller_1.default.getByQuery);
    app.post("/post", controller_1.default.post);
    app.patch("/patch", controller_1.default.patch);
    // ! Test new functionality
    app.post("/api/v1/send-sms", other_controllers_1.default.sendSmsCodeVerify);
    app.get("/api/v1/support-connect", other_controllers_1.default.connectSupport);
};
exports.default = routes;
