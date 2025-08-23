import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../init";
import { waitlistRouter } from "./waitlist.router";
import { emailRouter } from "@/features/auth/server/email.router";
import { authRouter } from "@/features/auth/server/auth.router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  emailRouter,
  waitlistRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
