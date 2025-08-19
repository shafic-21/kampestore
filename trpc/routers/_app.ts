import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../init";
import { emailRouter } from "./email.router";
export const appRouter = createTRPCRouter({
  emailRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
