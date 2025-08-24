import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/server/db";
import { creators } from "@/server/db/schema/creators";
import { eq, and } from "drizzle-orm";
import {
  createCreatorSchema,
  checkSlugSchema,
  generateSlugFromStoreName,
} from "../lib/validations";
import { TRPCError } from "@trpc/server";

export const creatorsRouter = createTRPCRouter({
  // Check if a creator slug is available
  checkSlugAvailability: protectedProcedure
    .input(checkSlugSchema)
    .query(async ({ input }) => {
      const existing = await db
        .select({ id: creators.id })
        .from(creators)
        .where(eq(creators.creatorSlug, input.slug))
        .limit(1);

      return {
        available: existing.length === 0,
        slug: input.slug,
      };
    }),

  // Generate slug suggestion from store name
  generateSlug: protectedProcedure
    .input(z.object({ storeName: z.string() }))
    .query(async ({ input }) => {
      const baseSlug = generateSlugFromStoreName(input.storeName);

      if (!baseSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unable to generate slug from store name",
        });
      }

      // Check if base slug is available
      const existing = await db
        .select({ id: creators.id })
        .from(creators)
        .where(eq(creators.creatorSlug, baseSlug))
        .limit(1);

      if (existing.length === 0) {
        return {
          slug: baseSlug,
          available: true,
        };
      }

      // Find available variant with number suffix
      for (let i = 2; i <= 100; i++) {
        const variant = `${baseSlug}-${i}`;
        const variantExists = await db
          .select({ id: creators.id })
          .from(creators)
          .where(eq(creators.creatorSlug, variant))
          .limit(1);

        if (variantExists.length === 0) {
          return {
            slug: variant,
            available: true,
          };
        }
      }

      throw new TRPCError({
        code: "CONFLICT",
        message: "Unable to find available slug variant",
      });
    }),

  // Create a new creator profile
  createCreator: protectedProcedure
    .input(createCreatorSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      // Check if user already has a creator profile
      const existingCreator = await db
        .select({ id: creators.id })
        .from(creators)
        .where(eq(creators.userId, userId))
        .limit(1);

      if (existingCreator.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already has a creator profile",
        });
      }

      // Check if slug is still available
      const slugExists = await db
        .select({ id: creators.id })
        .from(creators)
        .where(eq(creators.creatorSlug, input.creatorSlug))
        .limit(1);

      if (slugExists.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Creator slug is already taken",
        });
      }

      // Create the creator profile
      const [newCreator] = await db
        .insert(creators)
        .values({
          userId,
          creatorSlug: input.creatorSlug,
          storeName: input.storeName,
        })
        .returning();

      return {
        id: newCreator.id,
        creatorSlug: newCreator.creatorSlug,
        storeName: newCreator.storeName,
        success: true,
      };
    }),

  // Get current user's creator profile
  getMyCreatorProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not authenticated",
      });
    }

    const [creator] = await db
      .select({
        id: creators.id,
        creatorSlug: creators.creatorSlug,
        storeName: creators.storeName,
        createdAt: creators.createdAt,
      })
      .from(creators)
      .where(eq(creators.userId, userId))
      .limit(1);

    return creator || null;
  }),
});
