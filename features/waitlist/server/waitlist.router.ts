import { z } from "zod/v4";
import { createTRPCRouter, publicProcedure } from "../../../trpc/init";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { waitlist } from "@/server/db/schema/waitlist";
import { WaitlistWelcomeEmail } from "@/features/waitlist/email-templates/waitlist-welcome";
import { render } from "@react-email/components";
import { Resend } from "resend";

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

				// Send welcome email for new waitlist members
				if (!alreadyThere) {
					try {
						const apiKey = process.env.RESEND_API_KEY;
						if (!apiKey) {
							console.warn("RESEND_API_KEY environment variable is not set - skipping welcome email");
						} else {
							const resend = new Resend(apiKey);
							const html = await render(
								WaitlistWelcomeEmail({
									email: email.toLowerCase().trim(),
								}),
							);

							await resend.emails.send({
								from: "no-reply@kampestore.com",
								to: email.toLowerCase().trim(),
								subject: "Welcome to the Kampe waitlist! 🎉",
								html,
							});
						}
					} catch (emailError) {
						console.error("Failed to send welcome email:", emailError);
						// Don't throw error for email failure - still return success for waitlist signup
					}
				}

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
