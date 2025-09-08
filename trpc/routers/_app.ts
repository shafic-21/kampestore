import { createTRPCRouter } from "../init";
import { waitlistRouter } from "@/features/waitlist/server/waitlist.router";
import { authRouter } from "@/features/auth/server/auth.router";
import { creatorsRouter, baseSkuRouter } from "@/features/creators/server";
import { productDesignRouter } from "@/features/product-design/server/product-design.router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  waitlist: waitlistRouter,
  creators: creatorsRouter,
  baseSkus: baseSkuRouter,
  productDesign: productDesignRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
