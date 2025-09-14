import { createTRPCRouter } from "../init";
import { waitlistRouter } from "@/features/waitlist/server/waitlist.router";
import { authRouter } from "@/features/auth/server/auth.router";

import { productDesignRouter } from "@/features/product-design/server/product-design.router";
import { creatorsRouter } from "@/features/creators/server/creators.router";

export const appRouter = createTRPCRouter({
	auth: authRouter,
	waitlist: waitlistRouter,
	creators: creatorsRouter,
	productDesign: productDesignRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
