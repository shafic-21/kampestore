import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema/auth";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { MagicLinkEmail } from "@/components/emails/magic-link";

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
    magicLink({
      async sendMagicLink(data) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          throw new Error("RESEND_API_KEY environment variable is required");
        }
        const resend = new Resend(apiKey);
        const html = await render(
          MagicLinkEmail({ loginCode: data.token, loginUrl: data.url })
        );
        await resend.emails.send({
          from: "no-reply@kampestore.com",
          to: data.email,
          subject: "Use this code to login",
          html,
        });
        console.log(`Magic link sent to ${data.email}`);
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
