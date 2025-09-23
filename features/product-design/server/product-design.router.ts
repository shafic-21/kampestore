import { TRPCError } from "@trpc/server";
import { and, count, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";
import {
	deleteR2File,
	downloadFile,
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
import {
	attributes,
	attributeValueSetMembers,
	attributeValueSets,
	attributeValues,
	categories,
} from "@/server/db/schema/catalog";

import { publicProcedure } from "@/trpc/init";
import { CategoryNotFoundError } from "../types/errors.types";
import type { CachedProduct, NormalizedPlacement } from "../types/store.types";
import {
	transformBulkToCache,
	transformToCache,
} from "../utils/transform-cache";
import { listingProcedure } from "./listing.procedure";
import { mockupGeneratorRouter } from "./mockup.procedure";
import { MockupGenerator } from "./mockup-generator";
import { productSearchFiltersSchema } from "./schema";

const like = (q: string) => `%${q.trim()}%`;

export const productDesignRouter = {
	...listingProcedure,
	mockup: mockupGeneratorRouter,
	initializeStore: publicProcedure
		.input(z.object({ sku: z.uuid() }))
		.query(async ({ input }) => {
			const startTime = Date.now();
			try {
				const baseSkuId = input.sku;
				const [base] = await db
					.select({
						id: baseSkus.id,
						code: baseSkus.code,
						name: baseSkus.name,
						cost: baseSkus.cost,
						printSpec: baseSkus.printSpec,
					})
					.from(baseSkus)
					.where(eq(baseSkus.id, baseSkuId))
					.limit(1);

				if (!base) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Base SKU ${baseSkuId} not found`,
					});
				}

				const viewsRows = await db
					.select({
						viewId: baseSkuViews.id,
						viewCode: baseSkuViews.code,
						viewDisplayName: baseSkuViews.displayName,
						viewOrder: baseSkuViews.order,
						sourceWidthPx: baseSkuViews.sourceWidthPx,
						sourceHeightPx: baseSkuViews.sourceHeightPx,

						// print area (nullable)
						printAreaXPx: baseSkuPrintAreas.xPx,
						printAreaYPx: baseSkuPrintAreas.yPx,
						printAreaWidthPx: baseSkuPrintAreas.widthPx,
						printAreaHeightPx: baseSkuPrintAreas.heightPx,
						printAreaDpi: baseSkuPrintAreas.dpi,
					})
					.from(baseSkuViews)
					.leftJoin(
						baseSkuPrintAreas,
						eq(baseSkuViews.id, baseSkuPrintAreas.viewId),
					)
					.where(eq(baseSkuViews.baseSkuId, baseSkuId))
					.orderBy(baseSkuViews.order);

				// Editor background mockups per view
				const mockupRows = await db
					.select({
						viewId: baseSkuMockups.viewId,
						r2Key: baseSkuMockups.r2Key,
					})
					.from(baseSkuMockups)
					.where(
						and(
							eq(baseSkuMockups.baseSkuId, baseSkuId),
							eq(baseSkuMockups.purpose, "editor_background"),
						),
					);
				const mockupByView = new Map<string, string>(
					mockupRows.map((m) => [m.viewId, getPublicUrl(m.r2Key)]),
				);

				const [colorAttr] = await db
					.select({ id: attributes.id })
					.from(attributes)
					.where(eq(attributes.code, "color"))
					.limit(1);

				let colors: Array<{
					id: string;
					code: string;
					displayName: string;
					hexColor: string;
				}> = [];

				if (colorAttr) {
					const colorRows = await db
						.select({
							id: attributeValues.id,
							code: attributeValues.code,
							displayName: attributeValues.displayName,
							hexColor: attributeValues.hexColor,
							sortOrder: attributeValues.sortOrder,
						})
						.from(baseSkuAttributeRules)
						.innerJoin(
							attributeValueSets,
							eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id),
						)
						.innerJoin(
							attributeValueSetMembers,
							eq(attributeValueSets.id, attributeValueSetMembers.valueSetId),
						)
						.innerJoin(
							attributeValues,
							eq(attributeValueSetMembers.valueId, attributeValues.id),
						)
						.where(
							and(
								eq(baseSkuAttributeRules.baseSkuId, baseSkuId),
								eq(baseSkuAttributeRules.attributeId, colorAttr.id),
							),
						)
						.orderBy(attributeValues.sortOrder);

					colors = colorRows.map((c) => ({
						id: c.id,
						code: c.code ?? "",
						displayName: c.displayName,
						hexColor: c.hexColor ?? "#000000",
					}));
				}

				// Shape views array per requirements
				const views = viewsRows.map((r) => ({
					id: r.viewId,
					code: r.viewCode as "front" | "back" | string,
					displayName: r.viewDisplayName,
					order: r.viewOrder,
					sourceWidthPx: r.sourceWidthPx,
					sourceHeightPx: r.sourceHeightPx,
					printArea: {
						x_px: r.printAreaXPx ?? 0,
						y_px: r.printAreaYPx ?? 0,
						width_px: r.printAreaWidthPx ?? 300,
						height_px: r.printAreaHeightPx ?? 300,
						dpi: r.printAreaDpi ?? 150,
					},
					mockupImageUrl: mockupByView.get(r.viewId) ?? "",
				}));

				const elapsed = Date.now() - startTime;
				console.log(
					`[initializeStore] Success in ${elapsed}ms for baseSkuId=${baseSkuId}`,
				);
				return {
					baseSku: {
						id: base.id,
						code: base.code,
						name: base.name,
						cost: Number(base.cost),
						printSpec: base.printSpec ?? {},
						views,
						colors,
					},
				} as const;
			} catch (err) {
				const elapsed = Date.now() - startTime;
				console.error(`[initializeStore] FAILED after ${elapsed}ms`, {
					error: err,
					message: err instanceof Error ? err.message : "Unknown error",
					sku: input.sku,
				});
				if (err instanceof TRPCError) throw err;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to initialize editor store",
					cause: err,
				});
			}
		}),
	getCatalogForCache: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(30),
				excludeIds: z.array(z.string()).optional(),
			}),
		)
		.query(async ({ input }) => {
			try {
				// Get base products (excluding specified IDs)
				const conditions: SQL[] = [eq(baseSkus.status, "active")];

				if (input.excludeIds && input.excludeIds.length > 0) {
					conditions.push(
						sql`${baseSkus.id} NOT IN (${sql.join(
							input.excludeIds.map((id) => sql`${id}`),
							sql`, `,
						)})`,
					);
				}

				const products = await db
					.select({
						id: baseSkus.id,
						code: baseSkus.code,
						name: baseSkus.name,
						cost: baseSkus.cost,
						printSpec: baseSkus.printSpec,
					})
					.from(baseSkus)
					.where(and(...conditions))
					.limit(input.limit)
					.orderBy(sql`random()`); // Random mix for variety

				if (!products.length) return { products: [] };

				const productIds = products.map((p) => p.id);

				// Batch fetch views with print areas
				const viewsData = await db
					.select({
						baseSkuId: baseSkuViews.baseSkuId,
						viewId: baseSkuViews.id,
						viewCode: baseSkuViews.code,
						viewDisplayName: baseSkuViews.displayName,
						viewOrder: baseSkuViews.order,
						sourceWidthPx: baseSkuViews.sourceWidthPx,
						sourceHeightPx: baseSkuViews.sourceHeightPx,

						printAreaXPx: baseSkuPrintAreas.xPx,
						printAreaYPx: baseSkuPrintAreas.yPx,
						printAreaWidthPx: baseSkuPrintAreas.widthPx,
						printAreaHeightPx: baseSkuPrintAreas.heightPx,
						printAreaDpi: baseSkuPrintAreas.dpi,
					})
					.from(baseSkuViews)
					.leftJoin(
						baseSkuPrintAreas,
						eq(baseSkuViews.id, baseSkuPrintAreas.viewId),
					)
					.where(inArray(baseSkuViews.baseSkuId, productIds))
					.orderBy(baseSkuViews.order);

				// Batch fetch editor mockups
				const mockupsData = await db
					.select({
						baseSkuId: baseSkuMockups.baseSkuId,
						viewId: baseSkuMockups.viewId,
						r2Key: baseSkuMockups.r2Key,
					})
					.from(baseSkuMockups)
					.where(
						and(
							inArray(baseSkuMockups.baseSkuId, productIds),
							eq(baseSkuMockups.purpose, "editor_background"),
						),
					);

				// Batch fetch colors
				const [colorAttr] = await db
					.select({ id: attributes.id })
					.from(attributes)
					.where(eq(attributes.code, "color"))
					.limit(1);

				let colorsData: any[] = [];
				if (colorAttr) {
					colorsData = await db
						.select({
							baseSkuId: baseSkuAttributeRules.baseSkuId,
							colorId: attributeValues.id,
							colorCode: attributeValues.code,
							displayName: attributeValues.displayName,
							hexColor: attributeValues.hexColor,
							sortOrder: attributeValues.sortOrder,
						})
						.from(baseSkuAttributeRules)
						.innerJoin(
							attributeValueSets,
							eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id),
						)
						.innerJoin(
							attributeValueSetMembers,
							eq(attributeValueSets.id, attributeValueSetMembers.valueSetId),
						)
						.innerJoin(
							attributeValues,
							eq(attributeValueSetMembers.valueId, attributeValues.id),
						)
						.where(
							and(
								inArray(baseSkuAttributeRules.baseSkuId, productIds),
								eq(baseSkuAttributeRules.attributeId, colorAttr.id),
							),
						)
						.orderBy(attributeValues.sortOrder);
				}

				// Group data by product
				const viewsByProduct = new Map<string, typeof viewsData>();
				const mockupsByProduct = new Map<string, Map<string, string>>();
				const colorsByProduct = new Map<string, typeof colorsData>();

				viewsData.forEach((view) => {
					if (!viewsByProduct.has(view.baseSkuId)) {
						viewsByProduct.set(view.baseSkuId, []);
					}
					viewsByProduct.get(view.baseSkuId)!.push(view);
				});

				mockupsData.forEach((mockup) => {
					if (!mockupsByProduct.has(mockup.baseSkuId)) {
						mockupsByProduct.set(mockup.baseSkuId, new Map());
					}
					mockupsByProduct
						.get(mockup.baseSkuId)!
						.set(mockup.viewId, getPublicUrl(mockup.r2Key));
				});

				colorsData.forEach((color) => {
					if (!colorsByProduct.has(color.baseSkuId)) {
						colorsByProduct.set(color.baseSkuId, []);
					}
					colorsByProduct.get(color.baseSkuId)!.push(color);
				});

				// Transform to CachedProduct shape
				const cachedProducts = products.map((product) => {
					const views = viewsByProduct.get(product.id) || [];
					const mockups = mockupsByProduct.get(product.id) || new Map();
					const colors = colorsByProduct.get(product.id) || [];

					// Build views object matching CachedProduct type
					const viewsObject: CachedProduct["views"] = {};

					views.forEach((v) => {
						const viewCode = v.viewCode as "front" | "back";
						viewsObject[viewCode] = {
							id: v.viewId,
							code: v.viewCode,
							displayName: v.viewDisplayName,
							printArea: {
								x_px: v.printAreaXPx ?? 0,
								y_px: v.printAreaYPx ?? 0,
								width_px: v.printAreaWidthPx ?? 300,
								height_px: v.printAreaHeightPx ?? 300,
								dpi: v.printAreaDpi ?? 150,
							},
							template: {
								url: mockups.get(v.viewId) || "",
								sourceWidthPx: v.sourceWidthPx,
								sourceHeightPx: v.sourceHeightPx,
							},
						};
					});

					// Build colors object
					const colorsObject: CachedProduct["colors"] = {};
					colors.forEach((c, index) => {
						colorsObject[c.colorId] = {
							id: c.colorId,
							code: c.colorCode || "",
							displayName: c.displayName,
							hexValue: c.hexColor || "#000000",
						};
					});

					return {
						id: product.id,
						code: product.code,
						name: product.name,
						cost: Number(product.cost),
						placements: {},
						previews: {},
						views: viewsObject,
						colors: colorsObject,
						featuredColorId: colors[0].colorId,
						selectedColorIds: [colors[0].colorId],
						creatorPrice: Number(product.cost) * 1.2,
					};
				});

				return { products: cachedProducts };
			} catch (err) {
				console.error("[getCatalogForCache] Failed:", err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch catalog for cache",
					cause: err,
				});
			}
		}),
	getBaseCatalog: publicProcedure
		.input(productSearchFiltersSchema)
		.query(async ({ input }) => {
			try {
				// Validate category slug if provided
				if (input.category) {
					const [existing] = await db
						.select({ id: categories.id })
						.from(categories)
						.where(eq(categories.slug, input.category))
						.limit(1);

					if (!existing) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: new CategoryNotFoundError(input.category).message,
						});
					}
				}

				// Build WHERE conditions
				const conditions: (SQL | undefined)[] = [eq(baseSkus.status, "active")];

				if (input.excludeIds && input.excludeIds.length > 0) {
					conditions.push(
						sql`${baseSkus.id} NOT IN (${sql.join(
							input.excludeIds.map((id) => sql`${id}`),
							sql`, `,
						)})`,
					);
				}

				if (typeof input.query === "string" && input.query.trim()) {
					const pattern = like(input.query);
					const search = or(
						ilike(baseSkus.name, pattern),
						ilike(baseSkus.code, pattern),
						ilike(categories.name, pattern),
					);
					conditions.push(search);
				}

				if (input.category) {
					conditions.push(eq(categories.slug, input.category));
				}

				const whereClause = and(...(conditions.filter(Boolean) as SQL[]));

				// Total count
				const [{ count: totalCount = 0 } = { count: 0 }] = await db
					.select({ count: count() })
					.from(baseSkus)
					.innerJoin(categories, eq(baseSkus.categoryId, categories.id))
					.where(whereClause);

				const totalPages =
					input.limit > 0 ? Math.ceil(totalCount / input.limit) : 0;

				if (totalCount === 0) {
					// Return empty products plus categories for filters
					const cats = await db
						.select({
							id: categories.id,
							name: categories.name,
							slug: categories.slug,
							productCount: sql<number>`(
                  SELECT COUNT(*)
                  FROM base_skus bs
                  WHERE bs.category_id = ${categories.id}
                    AND bs.status = 'active'
                )`,
						})
						.from(categories)
						.where(eq(categories.level, 0));

					return {
						products: [],
						categories: cats.map((c) => ({
							id: c.id,
							name: c.name,
							slug: c.slug,
							productCount: c.productCount,
						})),
						totalProducts: 0,
						currentPage: input.page,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: false,
					};
				}

				// Page slice
				const offset = (input.page - 1) * input.limit;
				const pageRows = await db
					.select({
						id: baseSkus.id,
						code: baseSkus.code,
						name: baseSkus.name,
						cost: baseSkus.cost,
						categoryId: baseSkus.categoryId,
						categoryName: categories.name,
						categorySlug: categories.slug,
					})
					.from(baseSkus)
					.innerJoin(categories, eq(baseSkus.categoryId, categories.id))
					.where(whereClause)
					.limit(input.limit)
					.offset(offset);

				const pageIds = pageRows.map((p) => p.id);
				if (pageIds.length === 0) {
					return {
						products: [],
						categories: [],
						totalProducts: totalCount,
						currentPage: input.page,
						totalPages,
						hasNextPage: input.page < totalPages,
						hasPreviousPage: input.page > 1,
					};
				}

				// Hero images for product cards
				const heroRows = await db
					.select({
						baseSkuId: baseSkuMockups.baseSkuId,
						r2Key: baseSkuMockups.r2Key,
					})
					.from(baseSkuMockups)
					.where(
						and(
							inArray(baseSkuMockups.baseSkuId, pageIds),
							eq(baseSkuMockups.purpose, "display_card"),
						),
					);

				const heroById = heroRows.reduce<Record<string, string>>((acc, r) => {
					acc[r.baseSkuId] = r.r2Key;
					return acc;
				}, {});

				// Colors
				const [colorAttr] = await db
					.select({ id: attributes.id })
					.from(attributes)
					.where(eq(attributes.code, "color"))
					.limit(1);

				const colorsByBase: Record<
					string,
					{
						colors: Array<{
							id: string;
							hexValue: string; // Changed from hexColor to hexValue
							displayName: string;
						}>;
						totalColors: number;
					}
				> = {};

				if (colorAttr) {
					const colorRows = await db
						.select({
							baseSkuId: baseSkuAttributeRules.baseSkuId,
							colorId: attributeValues.id,
							hexColor: attributeValues.hexColor,
							displayName: attributeValues.displayName,
							sortOrder: attributeValues.sortOrder,
						})
						.from(baseSkuAttributeRules)
						.innerJoin(
							attributeValueSets,
							eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id),
						)
						.innerJoin(
							attributeValueSetMembers,
							eq(attributeValueSets.id, attributeValueSetMembers.valueSetId),
						)
						.innerJoin(
							attributeValues,
							eq(attributeValueSetMembers.valueId, attributeValues.id),
						)
						.where(
							and(
								inArray(baseSkuAttributeRules.baseSkuId, pageIds),
								eq(baseSkuAttributeRules.attributeId, colorAttr.id),
							),
						)
						.orderBy(attributeValues.sortOrder);

					const grouped = new Map<
						string,
						Array<{
							id: string;
							hexColor: string;
							displayName: string;
							sortOrder: number;
						}>
					>();

					for (const r of colorRows) {
						if (!grouped.has(r.baseSkuId)) grouped.set(r.baseSkuId, []);
						grouped.get(r.baseSkuId)!.push({
							id: r.colorId,
							hexColor: r.hexColor ?? "#000000",
							displayName: r.displayName,
							sortOrder: r.sortOrder ?? 0,
						});
					}

					for (const [baseSkuId, colors] of grouped) {
						const sorted = colors.sort((a, b) => a.sortOrder - b.sortOrder);
						const top10 = sorted.slice(0, 10);
						colorsByBase[baseSkuId] = {
							colors: top10.map((c) => ({
								id: c.id,
								hexValue: c.hexColor, // Map hexColor to hexValue
								displayName: c.displayName,
							})),
							totalColors: colors.length,
						};
					}
				}

				// Fit + material attributes using alias
				const jValues = alias(attributeValues, "j_values");
				const attrRows = await db
					.select({
						baseSkuId: baseSkuAttributeRules.baseSkuId,
						attributeCode: attributes.code,
						displayName: sql<string>`coalesce(${attributeValues.displayName}, ${jValues.displayName})`,
					})
					.from(baseSkuAttributeRules)
					.innerJoin(
						attributes,
						eq(baseSkuAttributeRules.attributeId, attributes.id),
					)
					.leftJoin(
						attributeValues,
						eq(baseSkuAttributeRules.valueId, attributeValues.id),
					)
					.leftJoin(
						attributeValueSets,
						eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id),
					)
					.leftJoin(
						attributeValueSetMembers,
						eq(attributeValueSets.id, attributeValueSetMembers.valueSetId),
					)
					.leftJoin(jValues, eq(attributeValueSetMembers.valueId, jValues.id))
					.where(
						and(
							inArray(baseSkuAttributeRules.baseSkuId, pageIds),
							eq(baseSkuAttributeRules.isVariantDefining, false),
							inArray(attributes.code, ["fit", "material"]),
						),
					)
					.orderBy(attributes.code);

				const attrsByBase: Record<string, string[]> = {};
				for (const r of attrRows) {
					if (!r.displayName) continue;
					if (!attrsByBase[r.baseSkuId]) attrsByBase[r.baseSkuId] = [];
					const list = attrsByBase[r.baseSkuId];
					if (!list.includes(r.displayName)) {
						if (r.attributeCode === "fit") list.unshift(r.displayName);
						else if (r.attributeCode === "material") list.push(r.displayName);
					}
				}

				// Categories for sidebar filters
				const cats = await db
					.select({
						id: categories.id,
						name: categories.name,
						slug: categories.slug,
						productCount: sql<number>`(
                SELECT COUNT(*)
                FROM base_skus bs
                WHERE bs.category_id = ${categories.id}
                  AND bs.status = 'active'
              )`,
					})
					.from(categories)
					.where(eq(categories.level, 0));

				const products = pageRows.map((p) => {
					const colorInfo = colorsByBase[p.id];
					return {
						id: p.id,
						code: p.code,
						name: p.name,
						attributes: attrsByBase[p.id] ?? [],
						cost: p.cost.toString(), // Keep as string for precision
						category: {
							id: p.categoryId,
							name: p.categoryName,
							slug: p.categorySlug,
						},
						colors: colorInfo?.colors ?? [],
						totalColors: colorInfo?.totalColors ?? 0,
						heroImageUrl: heroById[p.id] ? getPublicUrl(heroById[p.id]) : "",
					};
				});

				return {
					products,
					categories: cats.map((c) => ({
						id: c.id,
						name: c.name,
						slug: c.slug,
						productCount: c.productCount,
					})),
					totalProducts: totalCount,
					currentPage: input.page,
					totalPages,
					hasNextPage: input.page < totalPages,
					hasPreviousPage: input.page > 1,
				};
			} catch (err) {
				if (err instanceof TRPCError) throw err;
				console.error(err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch products for pick page",
					cause: err,
				});
			}
		}),
};
