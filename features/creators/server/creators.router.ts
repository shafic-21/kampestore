import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { generateKey, getPublicUrl, R2_PREFIXES, uploadFile } from "@/lib/r2";
import { db } from "@/server/db";
import { creators, stores } from "@/server/db/schema/creators";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/trpc/init";
import {
	checkSlugSchema,
	createCreatorSchema,
	generateSlugFromStoreName,
} from "../lib/validations";

export const creatorsRouter = createTRPCRouter({
	// Check if a store slug is available
	checkSlugAvailability: protectedProcedure
		.input(checkSlugSchema)
		.query(async ({ input }) => {
			const existing = await db
				.select({ id: stores.id })
				.from(stores)
				.where(eq(stores.storeSlug, input.slug))
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
				.select({ id: stores.id })
				.from(stores)
				.where(eq(stores.storeSlug, baseSlug))
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
					.select({ id: stores.id })
					.from(stores)
					.where(eq(stores.storeSlug, variant))
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
				.select({ id: stores.id })
				.from(stores)
				.where(eq(stores.storeSlug, input.storeSlug))
				.limit(1);

			if (slugExists.length > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Store slug is already taken",
				});
			}

			// Create the creator profile first
			const [newCreator] = await db
				.insert(creators)
				.values({
					userId,
				})
				.returning();

			// Create the store
			const [newStore] = await db
				.insert(stores)
				.values({
					creatorId: newCreator.id,
					storeName: input.storeName,
					storeSlug: input.storeSlug,
				})
				.returning();

			return {
				id: newCreator.id,
				storeSlug: newStore.storeSlug,
				storeName: newStore.storeName,
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

		const [result] = await db
			.select({
				id: creators.id,
				storeId: stores.id,
				storeSlug: stores.storeSlug,
				storeName: stores.storeName,
				description: stores.description,
				logoR2Key: stores.logoR2Key,
				bannerR2Key: stores.bannerR2Key,
				displaySocialsOnStore: creators.displaySocialsOnStore,
				xUrl: creators.xUrl,
				instagramUrl: creators.instagramUrl,
				facebookUrl: creators.facebookUrl,
				tiktokUrl: creators.tiktokUrl,
				createdAt: creators.createdAt,
			})
			.from(creators)
			.leftJoin(stores, eq(creators.id, stores.creatorId))
			.where(eq(creators.userId, userId))
			.limit(1);

		return result || null;
	}),

	// Update store information
	updateStore: protectedProcedure
		.input(
			z.object({
				storeName: z.string().min(1),
				description: z.string().optional(),
				displaySocialsOnStore: z.boolean(),
				logo: z
					.object({
						data: z.string(), // base64
						type: z.string(),
						name: z.string(),
					})
					.optional(),
				banner: z
					.object({
						data: z.string(), // base64
						type: z.string(),
						name: z.string(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.userId;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User is not authenticated",
				});
			}

			// Get creator profile to check ownership
			const [creator] = await db
				.select({ id: creators.id })
				.from(creators)
				.where(eq(creators.userId, userId))
				.limit(1);

			if (!creator) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Creator profile not found",
				});
			}

			// Get current store data
			const [currentStore] = await db
				.select({
					logoR2Key: stores.logoR2Key,
					bannerR2Key: stores.bannerR2Key,
				})
				.from(stores)
				.where(eq(stores.creatorId, creator.id))
				.limit(1);

			let logoR2Key = currentStore?.logoR2Key;
			let bannerR2Key = currentStore?.bannerR2Key;

			// Upload new logo if provided
			if (input.logo) {
				const logoKey = generateKey(
					R2_PREFIXES.STORE_LOGOS,
					input.logo.name,
					userId,
				);

				// Convert base64 to buffer
				const base64Data = input.logo.data.split(",")[1] || input.logo.data;
				const logoBuffer = Buffer.from(base64Data, "base64");

				await uploadFile("PUBLIC", {
					key: logoKey,
					body: logoBuffer,
					contentType: input.logo.type,
					metadata: {
						userId,
						type: "store-logo",
					},
				});
				logoR2Key = logoKey;
			}

			// Upload new banner if provided
			if (input.banner) {
				const bannerKey = generateKey(
					R2_PREFIXES.STORE_BANNERS,
					input.banner.name,
					userId,
				);

				// Convert base64 to buffer
				const base64Data = input.banner.data.split(",")[1] || input.banner.data;
				const bannerBuffer = Buffer.from(base64Data, "base64");

				await uploadFile("PUBLIC", {
					key: bannerKey,
					body: bannerBuffer,
					contentType: input.banner.type,
					metadata: {
						userId,
						type: "store-banner",
					},
				});
				bannerR2Key = bannerKey;
			}

			// Update store data
			const [updatedStore] = await db
				.update(stores)
				.set({
					storeName: input.storeName,
					description: input.description || null,
					logoR2Key,
					bannerR2Key,
					updatedAt: new Date(),
				})
				.where(eq(stores.creatorId, creator.id))
				.returning();

			// Update creator social settings
			await db
				.update(creators)
				.set({
					displaySocialsOnStore: input.displaySocialsOnStore,
					updatedAt: new Date(),
				})
				.where(eq(creators.id, creator.id));

			return {
				success: true,
				store: updatedStore,
			};
		}),

	// Public procedure to get store assets by store slug
	getStoreAssets: publicProcedure
		.input(z.object({ storeSlug: z.string() }))
		.query(async ({ input }) => {
			const [store] = await db
				.select({
					id: stores.id,
					storeName: stores.storeName,
					description: stores.description,
					logoR2Key: stores.logoR2Key,
					bannerR2Key: stores.bannerR2Key,
				})
				.from(stores)
				.where(eq(stores.storeSlug, input.storeSlug))
				.limit(1);

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			return {
				id: store.id,
				storeName: store.storeName,
				description: store.description,
				logoUrl: store.logoR2Key ? getPublicUrl(store.logoR2Key) : null,
				bannerUrl: store.bannerR2Key ? getPublicUrl(store.bannerR2Key) : null,
			};
		}),
});
