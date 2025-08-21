import { z } from "zod/v4";
import { createTRPCRouter, publicProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { waitlist } from "@/server/db/schema/waitlist";

export const waitlistRouter = {
  addToWaitlist: publicProcedure
    .input(
      z.object({
        email: z.email("Please enter a valid email address"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { email } = input;

        await db.insert(waitlist).values({
          email: email.toLowerCase().trim(),
        });

        return {
          success: true,
          message: "You're on the waitlist!",
        };
      } catch (error) {
        // Check if it's a unique constraint violation (email already exists)
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "23505"
        ) {
          return {
            success: true,
            message: "You're already on our waitlist! We'll be in touch soon.",
          };
        }

        console.error("Failed to add email to waitlist:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to join waitlist. Please try again.",
          cause: error,
        });
      }
    }),
};
