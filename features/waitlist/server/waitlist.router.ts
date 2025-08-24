import { z } from "zod/v4";
import { createTRPCRouter, publicProcedure } from "../../../trpc/init";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { waitlist } from "@/server/db/schema/waitlist";

export const waitlistRouter = {
  addToWaitlist: publicProcedure
    .input(
      z.object({
        email: z.email("Please enter a valid email address"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { email } = input;

        const inserted = await db
          .insert(waitlist)
          .values({ email: email.toLowerCase().trim() })
          .onConflictDoNothing({ target: waitlist.email })
          .returning({ id: waitlist.id });

        const alreadyThere = inserted.length === 0;

        return alreadyThere
          ? {
              success: true,
              message: "Already on our waitlist, see you soon!",
            }
          : {
              success: true,
              message: "Sweet! You're on the waitlist!",
            };
      } catch (error) {
        console.error("Failed to add email to waitlist:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to join waitlist. Please try again.",
          cause: error,
        });
      }
    }),
};
