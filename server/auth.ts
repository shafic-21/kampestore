import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema/auth";
import { magicLink } from "better-auth/plugins";
import { trpc } from "@/trpc/server";

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
        await trpc.emailRouter.sendMagicLink(data);
        console.log(`Magic link sent to ${data.email}`);
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
