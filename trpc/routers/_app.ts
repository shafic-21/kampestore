import { createTRPCRouter } from "../init";
import { waitlistRouter } from "@/features/waitlist/server/waitlist.router";
import { authRouter } from "@/features/auth/server/auth.router";
import { creatorsRouter, baseSkuRouter } from "@/features/creators/server";


export const appRouter = createTRPCRouter({
  auth: authRouter,
  waitlist: waitlistRouter,
  creators: creatorsRouter,
  baseSkus: baseSkuRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
