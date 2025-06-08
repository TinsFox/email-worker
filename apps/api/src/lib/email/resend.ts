import { env } from "cloudflare:workers";
import { Resend } from "resend";

export const sendEmail = async (
	email: string,
	subject: string,
	html: string,
	react?: React.ReactNode,
) => {
	const resend = new Resend(env.RESEND_API_KEY);
	await resend.emails.send({
		from: env.BETTER_AUTH_EMAIL || "",
		to: email,
		subject,
		html,
		react,
	});
};
