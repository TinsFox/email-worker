import { db } from "@/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI, username } from "better-auth/plugins";

import { env } from "cloudflare:workers";
import * as authSchema from "../../auth-schema";
import { sendEmail } from "./email/resend";
import { reactResetPasswordEmail } from "./email/rest-password";
const from = env.BETTER_AUTH_EMAIL;

export const auth = betterAuth({
	plugins: [username(), admin(), openAPI()],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
		usePlural: true,
	}),
	emailVerification: {
		async sendVerificationEmail({ user, url }) {
			const res = await sendEmail(
				user.email,
				"Verify your email address",
				`<a href="${url}">Verify your email address</a>`,
			);
			console.log("email verification", res, user.email);
		},
	},
	// emailAndPassword: {
	// 	enabled: true,
	// 	async sendResetPassword({ user, url }) {
	// 		const res = await sendEmail(
	// 			user.email,
	// 			"Reset your password",
	// 			reactResetPasswordEmail({
	// 				username: user.email,
	// 				resetLink: url,
	// 			}).render(),
	// 		);
	// 		console.log("email reset password", res, user.email);
	// 	},
	// },
});
