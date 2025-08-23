import { createTRPCRouter } from "../init";
import { waitlistRouter } from "@/features/waitlist/server/waitlist.router";
import { authRouter } from "@/features/auth/server/auth.router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  waitlist: waitlistRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
