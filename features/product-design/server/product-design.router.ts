import { TRPCError } from "@trpc/server";
import { and, count, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";
import {
  getPublicUrl,
  downloadFile,
  uploadFile,
  generateKey,
  R2_PREFIXES,
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
import {
  creatorListings,
  products,
  productVariants,
  variantAttributeValues,
} from "@/server/db/schema/products";
import { publicProcedure } from "@/trpc/init";
import { CategoryNotFoundError } from "../types/errors.types";
import type { CachedProduct } from "../types/store.types";
import { mockupGeneratorRouter } from "./mockup.router";
import { productSearchFiltersSchema } from "./schema";
import { MockupGenerator } from "./mockup-generator";

const like = (q: string) => `%${q.trim()}%`;

export const productDesignRouter = {
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

        // Views with optional print area
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
              isDefault: index === 0,
            };
          });

          return {
            id: product.id,
            code: product.code,
            name: product.name,
            cost: Number(product.cost),
            generatedPreview: null,
            views: viewsObject,
            colors: colorsObject,
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

  publishListing: publicProcedure
    .input(
      z.object({
        creatorId: z.uuid(),
        listing: z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          designs: z.record(
            z.string(),
            z.object({
              designR2Key: z.string(),
              placement: z.object({
                left: z.number(),
                top: z.number(),
                width: z.number(),
                height: z.number(),
                rotation: z.number(),
                relativeMidXOffset: z.number(),
                relativeMidYOffset: z.number(),
              }),
            }),
          ),
          products: z
            .array(
              z.object({
                baseSkuId: z.uuid(),
                price: z.number().positive(),
                colors: z
                  .array(z.uuid())
                  .min(1, "At least one color is required"),
                featuredColorId: z.uuid().nullable(),
              }),
            )
            .min(1, "At least one product is required"),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        const result = await db.transaction(async (tx) => {
          // Generate unique slug from title
          const baseSlug = input.listing.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 50);

          const timestamp = Date.now().toString(36);
          const slug = `${baseSlug}-${timestamp}`;

          // Extract design data
          const frontDesign = input.listing.designs.front;
          const backDesign = input.listing.designs.back;

          // Create creator listing
          const [listingRecord] = await tx
            .insert(creatorListings)
            .values({
              creatorId: input.creatorId,
              title: input.listing.title,
              slug: slug,
              status: "published",
              publishedAt: new Date(),
              frontDesignR2Key: frontDesign?.designR2Key || null,
              frontPlacement: frontDesign?.placement || null,
              backDesignR2Key: backDesign?.designR2Key || null,
              backPlacement: backDesign?.placement || null,
              metaTitle: input.listing.title,
              metaDescription: input.listing.description || null,
            })
            .returning({ id: creatorListings.id });

          const listingId = listingRecord.id;

          // Process each product in the listing
          const createdProducts: string[] = [];

          for (const productData of input.listing.products) {
            // Create product record
            const [productRecord] = await tx
              .insert(products)
              .values({
                listingId: listingId,
                baseSkuId: productData.baseSkuId,
                price: BigInt(Math.round(productData.price)),
              })
              .returning({ id: products.id });

            const productId = productRecord.id;
            createdProducts.push(productId);

            // Get base SKU data with views and templates
            const baseSkuData = await tx
              .select({
                baseId: baseSkus.id,
                baseName: baseSkus.name,
                viewId: baseSkuViews.id,
                viewCode: baseSkuViews.code,
                viewDisplayName: baseSkuViews.displayName,
                sourceWidthPx: baseSkuViews.sourceWidthPx,
                sourceHeightPx: baseSkuViews.sourceHeightPx,
                printAreaXPx: baseSkuPrintAreas.xPx,
                printAreaYPx: baseSkuPrintAreas.yPx,
                printAreaWidthPx: baseSkuPrintAreas.widthPx,
                printAreaHeightPx: baseSkuPrintAreas.heightPx,
                printAreaDpi: baseSkuPrintAreas.dpi,
                templateR2Key: baseSkuMockups.r2Key,
              })
              .from(baseSkus)
              .innerJoin(baseSkuViews, eq(baseSkus.id, baseSkuViews.baseSkuId))
              .leftJoin(
                baseSkuPrintAreas,
                eq(baseSkuViews.id, baseSkuPrintAreas.viewId),
              )
              .leftJoin(
                baseSkuMockups,
                and(
                  eq(baseSkuMockups.baseSkuId, baseSkus.id),
                  eq(baseSkuMockups.viewId, baseSkuViews.id),
                  eq(baseSkuMockups.purpose, "editor_background"),
                ),
              )
              .where(eq(baseSkus.id, productData.baseSkuId));

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

            // Group views by code
            const viewsByCode = new Map<string, (typeof baseSkuData)[0]>();
            for (const view of baseSkuData) {
              viewsByCode.set(view.viewCode, view);
            }

            // Create variants for each selected color
            for (const colorId of productData.colors) {
              const isFeatured =
                colorId === productData.featuredColorId ||
                (productData.colors[0] === colorId &&
                  !productData.featuredColorId);

              const comboHash = `${productId.substring(0, 8)}_${colorId.substring(0, 8)}`;
              const sku = `P-${comboHash.toUpperCase()}`;

              // Generate mockups for front and back views
              let primaryMockupR2Key = null;
              let secondaryMockupR2Key = null;

              // Generate front mockup
              const frontView = viewsByCode.get("front");
              if (frontView?.templateR2Key) {
                try {
                  const mockup = await MockupGenerator.generateMockup({
                    designBuffer: await downloadFile(
                      "PUBLIC",
                      frontDesign.designR2Key,
                    ),
                    templateBuffer: await downloadFile(
                      "PUBLIC",
                      frontView.templateR2Key,
                    ),
                    backgroundColor: colorMap.get(colorId) || "#FFFFFF",
                    templateSize: {
                      width: frontView.sourceWidthPx,
                      height: frontView.sourceHeightPx,
                    },
                    printArea: {
                      x_px: frontView.printAreaXPx || 0,
                      y_px: frontView.printAreaYPx || 0,
                      width_px: frontView.printAreaWidthPx || 300,
                      height_px: frontView.printAreaHeightPx || 300,
                      dpi: frontView.printAreaDpi || 300,
                    },
                    placement: frontDesign?.placement || null,
                    outputFormat: "png",
                    quality: 90,
                  });

                  // Upload to R2 PUBLIC bucket
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
                } catch (error) {
                  console.error(
                    `Failed to generate front mockup for ${sku}:`,
                    error,
                  );
                }
              }

              // Generate back mockup if design and template exist
              const backView = viewsByCode.get("back");
              if (backDesign?.designR2Key && backView?.templateR2Key) {
                try {
                  const mockup = await MockupGenerator.generateMockup({
                    designBuffer: await downloadFile(
                      "PRIVATE",
                      backDesign.designR2Key,
                    ),
                    templateBuffer: await downloadFile(
                      "PUBLIC",
                      backView.templateR2Key,
                    ),
                    backgroundColor: colorMap.get(colorId) || "#FFFFFF",
                    templateSize: {
                      width: backView.sourceWidthPx,
                      height: backView.sourceHeightPx,
                    },
                    printArea: {
                      x_px: backView.printAreaXPx || 0,
                      y_px: backView.printAreaYPx || 0,
                      width_px: backView.printAreaWidthPx || 300,
                      height_px: backView.printAreaHeightPx || 300,
                      dpi: backView.printAreaDpi || 300,
                    },
                    placement: backDesign.placement,
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
                } catch (error) {
                  console.error(
                    `Failed to generate back mockup for ${sku}:`,
                    error,
                  );
                }
              }

              // Create product variant with mockup keys
              const [variantRecord] = await tx
                .insert(productVariants)
                .values({
                  productId: productId,
                  sku: sku,
                  comboHash: comboHash,
                  price: BigInt(Math.round(productData.price)),
                  primaryMockupR2Key,
                  secondaryMockupR2Key,
                })
                .returning({ id: productVariants.id });

              const variantId = variantRecord.id;

              // Find color attribute ID and link variant to color
              const [colorAttribute] = await tx
                .select({ id: attributes.id })
                .from(attributes)
                .where(eq(attributes.code, "color"))
                .limit(1);

              if (colorAttribute) {
                await tx.insert(variantAttributeValues).values({
                  variantId: variantId,
                  attributeId: colorAttribute.id,
                  attributeValueId: colorId,
                });
              }
            }
          }

          return {
            listingId,
            slug,
            createdProducts,
          };
        });

        const elapsed = Date.now() - startTime;
        console.log(
          `[publishListing] Success in ${elapsed}ms - listingId=${result.listingId}`,
        );

        return {
          success: true,
          listingId: result.listingId,
          slug: result.slug,
          url: `/creators/${input.creatorId}/${result.slug}`,
        };
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[publishListing] FAILED after ${elapsed}ms`, {
          error: err,
          creatorId: input.creatorId,
          title: input.listing.title,
        });

        if (err instanceof TRPCError) throw err;

        // Handle common database constraint errors
        if (err && typeof err === "object" && "code" in err) {
          if (err.code === "23505") {
            // Unique constraint violation
            throw new TRPCError({
              code: "CONFLICT",
              message: "A listing with this title already exists",
            });
          }
          if (err.code === "23503") {
            // Foreign key constraint violation
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid creator ID or product ID",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish listing",
          cause: err,
        });
      }
    }),
};
