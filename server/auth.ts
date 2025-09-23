import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema/auth";
import { emailOTP } from "better-auth/plugins";
import { OTPWithMagicLinkEmail } from "@/features/auth/email-templates/otp-with-magic-link";
import { render } from "@react-email/components";
import { Resend } from "resend";

const webURL = process.env.CORS_ORIGIN;

if (!webURL) {
	throw new Error("Web url missing");
}

export const auth = betterAuth({
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	trustedOrigins: [webURL],
	plugins: [
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				if (type === "sign-in") {
					const apiKey = process.env.RESEND_API_KEY;
					if (!apiKey) {
						throw new Error("RESEND_API_KEY environment variable is required");
					}

					const resend = new Resend(apiKey);
					const html = await render(
						OTPWithMagicLinkEmail({
							otp,
						}),
					);

					await resend.emails.send({
						from: "no-reply@kampestore.com",
						to: email,
						subject: `${otp} is your verification code.`,
						html,
					});
				} else if (type === "email-verification") {
				} else {
				}
			},
			otpLength: 6,
			expiresIn: 300,
			overrideDefaultEmailVerification: true,
			allowedAttempts: 3,
			sendVerificationOnSignUp: true,
		}),
	],
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	telemetry: { enabled: false },
});
