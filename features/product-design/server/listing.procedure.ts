import { TRPCError } from "@trpc/server";
import { and, count, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";
import {
	deleteR2File,
	downloadFile,
	extractKeyFromPublicUrl,
	generateKey,
	getPublicUrl,
	R2_PREFIXES,
	uploadFile,
} from "@/lib/r2";
import { db } from "@/server/db";
import {
	baseSkuAttributeRules,
	baseSkuMockups,
	baseSkuPrintAreas,
	baseSkus,
	baseSkuViews,
} from "@/server/db/schema/bases";
import { attributes, attributeValues } from "@/server/db/schema/catalog";
import {
	creatorListings,
	products,
	productVariants,
	variantAttributeValues,
} from "@/server/db/schema/products";
import { publicProcedure } from "@/trpc/init";
import type { NormalizedPlacement } from "../types/store.types";
import { generateSingleMockup } from "./mockup-generator";
import { publishListingSchema } from "./schema";

export const listingProcedure = {
	publishListing: publicProcedure
		.input(publishListingSchema)
		.mutation(async ({ input }) => {
			const startTime = Date.now();

			return await db.transaction(async (tx) => {
				// Generate slug
				const baseSlug = input.listing.title
					.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, "")
					.replace(/\s+/g, "-")
					.substring(0, 50);
				const timestamp = Date.now().toString(36);
				const slug = `${baseSlug}-${timestamp}`;

				// Create listing
				const [listingRecord] = await tx
					.insert(creatorListings)
					.values({
						creatorId: input.creatorId,
						title: input.listing.title,
						slug: slug,
						status: "published",
						publishedAt: new Date(),
						frontDesignR2Key: input.listing.designs.front?.designR2Key || null,
						backDesignR2Key: input.listing.designs.back?.designR2Key || null,
						metaTitle: input.listing.title,
						metaDescription: input.listing.description || null,
					})
					.returning({ id: creatorListings.id });

				const listingId = listingRecord.id;
				const uploadedMockupKeys: string[] = [];

				try {
					// Get attribute IDs with proper error handling
					const [colorAttributeResult, sizeAttributeResult] = await Promise.all(
						[
							tx
								.select({ id: attributes.id })
								.from(attributes)
								.where(eq(attributes.code, "color"))
								.limit(1),
							tx
								.select({ id: attributes.id })
								.from(attributes)
								.where(eq(attributes.code, "size"))
								.limit(1),
						],
					);

					// Validate attributes exist
					if (colorAttributeResult.length === 0) {
						throw new Error(
							"Color attribute not found in database. Please ensure 'color' attribute exists.",
						);
					}
					if (sizeAttributeResult.length === 0) {
						throw new Error(
							"Size attribute not found in database. Please ensure 'size' attribute exists.",
						);
					}

					const colorAttribute = colorAttributeResult[0];
					const sizeAttribute = sizeAttributeResult[0];

					for (const productData of input.listing.products) {
						// Validate that all color IDs exist in attributeValues
						const existingColors = await tx
							.select({ id: attributeValues.id })
							.from(attributeValues)
							.where(inArray(attributeValues.id, productData.colors));

						if (existingColors.length !== productData.colors.length) {
							const existingColorIds = existingColors.map((c) => c.id);
							const missingColors = productData.colors.filter(
								(id) => !existingColorIds.includes(id),
							);
							throw new Error(
								`Color attribute values not found: ${missingColors.join(", ")}`,
							);
						}

						// Validate that all size IDs exist in attributeValues
						const sizeIds = productData.sizes.map((size) => size.id);
						const existingSizes = await tx
							.select({ id: attributeValues.id })
							.from(attributeValues)
							.where(inArray(attributeValues.id, sizeIds));

						if (existingSizes.length !== sizeIds.length) {
							const existingSizeIds = existingSizes.map((s) => s.id);
							const missingSizes = sizeIds.filter(
								(id) => !existingSizeIds.includes(id),
							);
							throw new Error(
								`Size attribute values not found: ${missingSizes.join(", ")}`,
							);
						}

						// Create product
						const [productRecord] = await tx
							.insert(products)
							.values({
								listingId: listingId,
								baseSkuId: productData.baseSkuId,
								price: BigInt(Math.round(productData.price)),
								frontPlacement: productData.placements?.front || null,
								backPlacement: productData.placements?.back || null,
							})
							.returning({ id: products.id });

						const productId = productRecord.id;

						// Get color data
						const colorData = await tx
							.select({
								colorId: attributeValues.id,
								hexColor: attributeValues.hexColor,
							})
							.from(attributeValues)
							.where(inArray(attributeValues.id, productData.colors));

						const colorMap = new Map(
							colorData.map((c) => [c.colorId, c.hexColor]),
						);

						// Cache mockups per color
						const colorMockupCache = new Map<
							string,
							{ front?: string; back?: string }
						>();

						// Create variants for EVERY color-size combination
						for (const colorId of productData.colors) {
							// Generate mockups once per color
							if (!colorMockupCache.has(colorId)) {
								let primaryMockupR2Key = null;
								let secondaryMockupR2Key = null;

								// Generate front mockup
								const frontView = productData.baseViews.front;
								if (
									input.listing.designs.front?.designR2Key &&
									frontView?.template
								) {
									try {
										const mockup = await generateSingleMockup({
											designR2Key: input.listing.designs.front.designR2Key,
											templateR2Key: extractKeyFromPublicUrl(
												frontView.template.url,
											),
											backgroundColor: colorMap.get(colorId) || "#FFFFFF",
											templateSize: {
												width: frontView.template.sourceWidthPx,
												height: frontView.template.sourceHeightPx,
											},
											printArea: {
												x_px: frontView.printArea.x_px || 0,
												y_px: frontView.printArea.y_px || 0,
												width_px: frontView.printArea.width_px || 300,
												height_px: frontView.printArea.height_px || 300,
												dpi: frontView.printArea.dpi || 300,
											},
											placement: productData.placements
												?.front as NormalizedPlacement,
											outputFormat: "png",
											quality: 90,
										});

										const mockupKey = generateKey(
											R2_PREFIXES.MOCKUPS,
											`${listingId}/${productId}_${colorId}_front.png`,
										);

										await uploadFile("PUBLIC", {
											key: mockupKey,
											body: mockup.mockupBuffer,
											contentType: "image/png",
											metadata: {
												listingId,
												productId,
												colorId,
												view: "front",
											},
										});

										primaryMockupR2Key = mockupKey;
										uploadedMockupKeys.push(mockupKey);
									} catch (error) {
										console.error(
											`Failed to generate front mockup for color ${colorId}:`,
											error,
										);
									}
								}

								// Generate back mockup - FIXED: Use back view instead of front
								const backView = productData.baseViews.back; // Changed from .front
								if (
									backView &&
									input.listing.designs.back?.designR2Key &&
									backView.template
								) {
									try {
										const mockup = await generateSingleMockup({
											designR2Key: input.listing.designs.back.designR2Key, // Changed from .front
											templateR2Key: extractKeyFromPublicUrl(
												backView.template.url,
											),
											backgroundColor: colorMap.get(colorId) || "#FFFFFF",
											templateSize: {
												width: backView.template.sourceWidthPx,
												height: backView.template.sourceHeightPx,
											},
											printArea: {
												x_px: backView.printArea.x_px || 0,
												y_px: backView.printArea.y_px || 0,
												width_px: backView.printArea.width_px || 300,
												height_px: backView.printArea.height_px || 300,
												dpi: backView.printArea.dpi || 300,
											},
											placement: productData.placements
												?.back as NormalizedPlacement, // Changed from .front
											outputFormat: "png",
											quality: 90,
										});

										const mockupKey = generateKey(
											R2_PREFIXES.MOCKUPS,
											`${listingId}/${productId}_${colorId}_back.png`,
										);

										await uploadFile("PUBLIC", {
											key: mockupKey,
											body: mockup.mockupBuffer,
											contentType: "image/png",
											metadata: {
												listingId,
												productId,
												colorId,
												view: "back",
											},
										});

										secondaryMockupR2Key = mockupKey;
										uploadedMockupKeys.push(mockupKey);
									} catch (error) {
										console.error(
											`Failed to generate back mockup for color ${colorId}:`,
											error,
										);
									}
								}

								colorMockupCache.set(colorId, {
									front: primaryMockupR2Key || undefined,
									back: secondaryMockupR2Key || undefined,
								});
							}

							// Now create variants for each size of this color
							for (const size of productData.sizes) {
								const comboHash = `${productId.substring(0, 8)}_${colorId.substring(0, 8)}_${size.id.substring(0, 8)}`;
								const sku = `P-${comboHash.toUpperCase()}`;

								const colorMockups = colorMockupCache.get(colorId);

								// Create variant
								const [variantRecord] = await tx
									.insert(productVariants)
									.values({
										productId: productId,
										sku: sku,
										comboHash: comboHash,
										price: BigInt(Math.round(productData.price)),
										primaryMockupR2Key: colorMockups?.front,
										secondaryMockupR2Key: colorMockups?.back,
									})
									.returning({ id: productVariants.id });

								// Create attribute values for the variant
								const attributeValues = [
									{
										variantId: variantRecord.id,
										attributeId: colorAttribute.id,
										attributeValueId: colorId,
									},
									{
										variantId: variantRecord.id,
										attributeId: sizeAttribute.id,
										attributeValueId: size.id, // This should be a UUID from attributeValues table
									},
								];

								await tx.insert(variantAttributeValues).values(attributeValues);

								console.log(
									`Created variant ${variantRecord.id} with color ${colorId} and size ${size.id}`,
								);
							}
						}
					}

					const elapsed = Date.now() - startTime;
					console.log(
						`[publishListing] Success in ${elapsed}ms - listingId=${listingId}`,
					);

					return { success: true, slug: slug };
				} catch (TRPCError) {
					// Clean up uploaded files (transaction will auto-rollback DB changes)
					console.log(TRPCError);
					for (const mockupKey of uploadedMockupKeys) {
						try {
							await deleteR2File("PUBLIC", mockupKey);
						} catch (deleteError) {
							console.error(
								`Failed to delete mockup ${mockupKey}:`,
								deleteError,
							);
						}
					}
					throw TRPCError; // Re-throw to trigger transaction rollback
				}
			});
		}),

	getListingPreviewForSuccess: publicProcedure
		.input(z.object({ listing_slug: z.string() }))
		.query(async ({ input }) => {
			// Get listing with products and their variants
			const listingData = await db
				.select({
					listingId: creatorListings.id,
					listingTitle: creatorListings.title,
					listingSlug: creatorListings.slug,
					productId: products.id,
					productPrice: products.price,
					baseSkuId: baseSkus.id,
					baseSkuName: baseSkus.name,
					variantId: productVariants.id,
					primaryMockupR2Key: productVariants.primaryMockupR2Key,
				})
				.from(creatorListings)
				.innerJoin(products, eq(creatorListings.id, products.listingId))
				.innerJoin(baseSkus, eq(products.baseSkuId, baseSkus.id))
				.leftJoin(productVariants, eq(products.id, productVariants.productId))
				.where(eq(creatorListings.slug, input.listing_slug))
				.orderBy(products.id, productVariants.id);

			if (listingData.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Listing not found",
				});
			}

			// Group by product and get first variant with mockup for each
			const productsMap = new Map();

			for (const row of listingData) {
				const productKey = row.productId;

				if (!productsMap.has(productKey)) {
					productsMap.set(productKey, {
						id: row.productId,
						baseSkuId: row.baseSkuId,
						baseSkuName: row.baseSkuName,
						price: Number(row.productPrice), // Convert bigint to number
						previewImageUrl: row.primaryMockupR2Key
							? getPublicUrl(row.primaryMockupR2Key)
							: null,
					});
				}
			}

			return {
				id: listingData[0].listingId,
				title: listingData[0].listingTitle,
				slug: listingData[0].listingSlug,
				products: Array.from(productsMap.values()),
			};
		}),
};
