"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;
const twilio_1 = __importDefault(require("twilio"));
const client = (0, twilio_1.default)(accountSid, authToken);
const sendVerification = async () => {
    try {
        const verification = await client.verify.v2
            .services(verifySid)
            .verifications.create({ to: "+996990385056", channel: "sms" });
        console.log(verification.status);
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = sendVerification;
