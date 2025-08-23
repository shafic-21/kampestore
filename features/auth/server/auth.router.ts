import { db } from "@/server/db";
import { user } from "@/server/db/schema/auth";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRateLimitMiddleware } from "@/trpc/middleware/rate-limit";
import { checkUserExistsSchema } from "../lib/validations";

const emailCheckRateLimit = createRateLimitMiddleware({
  maxRequests: 5,
  windowMs: 60 * 1000,
  keyExtractor: (input) => input?.email || "unknown",
});

export const authRouter = {
  checkUserExists: emailCheckRateLimit
    .input(checkUserExistsSchema)
    .query(async ({ input }) => {
      try {
        const existingUser = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, input.email))
          .limit(1);

        return {
          exists: existingUser.length > 0,
          email: input.email,
        };
      } catch (error) {
        console.error("Error checking user existence:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check user existence",
          cause: error,
        });
      }
    }),
};