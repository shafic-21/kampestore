import { z } from "zod/v4";
import { publicProcedure, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { user } from "@/server/db/schema/auth";
import { eq } from "drizzle-orm";

export const authRouter = {
	checkUserExists: publicProcedure
		.input(z.object({ email: z.email() }))
		.query(async ({ input }) => {
			try {
				const existingUser = await db
					.select({ id: user.id })
					.from(user)
					.where(eq(user.email, input.email))
					.limit(1);

				return { exists: existingUser.length > 0 };
			} catch (error) {
				console.error("Failed to check user existence:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to check user existence",
					cause: error,
				});
			}
		}),

	updateUserProfile: protectedProcedure
		.input(
			z.object({
				name: z
					.string()
					.min(2, "Name must be at least 2 characters")
					.optional(),
				phone: z
					.string()
					.regex(/^\d{9,15}$/, "Phone number must be 9-15 digits")
					.optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.user.id;

			try {
				const updateData: { name?: string; phone?: string; updatedAt: Date } = {
					updatedAt: new Date(),
				};

				if (input.name !== undefined) {
					updateData.name = input.name;
				}

				if (input.phone !== undefined) {
					updateData.phone = input.phone;
				}

				const [updatedUser] = await db
					.update(user)
					.set(updateData)
					.where(eq(user.id, userId))
					.returning();

				return {
					success: true,
					user: {
						id: updatedUser.id,
						name: updatedUser.name,
						email: updatedUser.email,
						phone: updatedUser.phone,
					},
				};
			} catch (error) {
				console.error("Failed to update user profile:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update profile",
					cause: error,
				});
			}
		}),
};
