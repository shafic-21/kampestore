import { createTRPCRouter } from "../init";
import { waitlistRouter } from "@/features/waitlist/server/waitlist.router";
import { authRouter } from "@/features/auth/server/auth.router";
import { creatorsRouter } from "@/features/creators/server/creators.router";
import { productsRouter } from "@/features/products/server/products.router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  waitlist: waitlistRouter,
  creators: creatorsRouter,
  products: productsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
