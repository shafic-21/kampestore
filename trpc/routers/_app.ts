import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../init";
import { emailRouter } from "./email.router";
import { waitlistRouter } from "./waitlist.router";

export const appRouter = createTRPCRouter({
  emailRouter,
  waitlistRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
