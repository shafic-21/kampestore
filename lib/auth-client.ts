import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  plugins: [emailOTPClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export { authClient as auth };
