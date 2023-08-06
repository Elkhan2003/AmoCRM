// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
const authToken = process.env.TWILIO_AUTH_TOKEN as string;
const verifySid = process.env.TWILIO_VERIFY_SID as string;
import twilio from "twilio";
const client = twilio(accountSid, authToken);

const sendVerification = async () => {
	try {
		const verification = await client.verify.v2
			.services(verifySid)
			.verifications.create({ to: "+996990385056", channel: "sms" });

		console.log(verification.status);
	} catch (error) {
		console.error(error);
	}
};

export default sendVerification;
