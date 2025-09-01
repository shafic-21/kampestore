// src/features/creators/server/routers/baseSkuRouter.ts
import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";
import { productSearchFiltersSchema } from "../schema";
import { db } from "@/server/db";
import {
  baseSkus,
  baseSkuAttributeRules,
  baseSkuMockups,
  baseSkuViews,
  baseSkuPrintAreas,
} from "@/server/db/schema/bases";
import {
  categories,
  attributes,
  attributeValues,
  attributeValueSets,
  attributeValueSetMembers,
} from "@/server/db/schema/catalog";
import { getPublicUrl } from "@/lib/r2";
import {
  eq,
  and,
  or,
  inArray,
  ilike,
  sql,
  type SQL,
  count,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  BaseSkuNotFoundError,
  CategoryNotFoundError,
  type ProductCategory,
} from "../types";

// helpers
const like = (q: string) => `%${q.trim()}%`;

export const baseSkuRouter = createTRPCRouter({
  listBaseProducts: publicProcedure
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

        // Build WHERE conditions – allow undefined, then filter them out before `and(...)`
        const conditions: (SQL | undefined)[] = [eq(baseSkus.status, "active")];

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

        // Total count (numeric)
        const [{ count: totalCount = 0 } = { count: 0 }] = await db
          .select({ count: count() })
          .from(baseSkus)
          .innerJoin(categories, eq(baseSkus.categoryId, categories.id))
          .where(whereClause);

        const totalPages =
          input.limit > 0 ? Math.ceil(totalCount / input.limit) : 0;

        if (totalCount === 0) {
          // Return empty products plus top-level categories for filters
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
            products: [] as never[],
            categories: cats.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              imageUrl: "",
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
            products: [] as never[],
            categories: [] as never[],
            totalProducts: totalCount,
            currentPage: input.page,
            totalPages,
            hasNextPage: input.page < totalPages,
            hasPreviousPage: input.page > 1,
          };
        }

        // Hero images
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
        console.log('[listBaseProducts] Fetching color attribute');
        let colorAttr;
        try {
          [colorAttr] = await db
            .select({ id: attributes.id })
            .from(attributes)
            .where(eq(attributes.code, "color"))
            .limit(1);
          console.log('[listBaseProducts] Color attribute found:', colorAttr?.id);
        } catch (err) {
          console.error('[listBaseProducts] Color attribute query failed:', err);
          colorAttr = null;
        }

        const colorsByBase: Record<
          string,
          { colors: Array<{ id: string; hexColor: string; displayName: string }>; totalColors: number }
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
            Array<{ id: string; hexColor: string; displayName: string; sortOrder: number }>
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
                hexColor: c.hexColor,
                displayName: c.displayName,
              })),
              totalColors: colors.length,
            };
          }
        }

        // Fit + material (table alias via `alias(...)`)
        const jValues = alias(attributeValues, "j_values");
        const attrRows = await db
          .select({
            baseSkuId: baseSkuAttributeRules.baseSkuId,
            attributeCode: attributes.code,
            displayName: sql<string>`coalesce(${attributeValues.displayName}, ${jValues.displayName})`,
          })
          .from(baseSkuAttributeRules)
          .innerJoin(attributes, eq(baseSkuAttributeRules.attributeId, attributes.id))
          .leftJoin(attributeValues, eq(baseSkuAttributeRules.valueId, attributeValues.id))
          .leftJoin(attributeValueSets, eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id))
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

        // Categories for sidebar
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
            cost: p.cost.toString(),
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
            imageUrl: "",
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
          message: "Failed to search base products",
          cause: err,
        });
      
      }
    }),

  getProductCategories: publicProcedure.query(async () => {
    const startTime = Date.now();
    console.log('[getProductCategories] Starting');
    
    try {
      console.log('[getProductCategories] Fetching categories with product counts');
      let rows;
      try {
        rows = await db
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
        console.log(`[getProductCategories] Found ${rows.length} categories`);
      } catch (err) {
        console.error('[getProductCategories] Query failed:', err);
        throw new Error(`Categories query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      const out: ProductCategory[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        imageUrl: "",
        productCount: r.productCount,
      }));

      console.log(`[getProductCategories] Success! Returning ${out.length} categories in ${Date.now() - startTime}ms`);
      return out;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      console.error(`[getProductCategories] FAILED after ${elapsed}ms:`, {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined,
      });
      
      if (err instanceof TRPCError) throw err;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch categories: ${err instanceof Error ? err.message : 'Unknown error'}`,
        cause: err,
      });
    }
  }),

  getBaseProductById: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const startTime = Date.now();
      console.log('[getBaseProductById] Starting with ID:', input.id);
      
      try {
        console.log('[getBaseProductById] Fetching product details');
        let product;
        try {
          [product] = await db
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
            .where(and(eq(baseSkus.id, input.id), eq(baseSkus.status, "active")))
            .limit(1);
          
          console.log('[getBaseProductById] Product found:', product ? product.name : 'NOT FOUND');
        } catch (err) {
          console.error('[getBaseProductById] Product query failed:', err);
          throw new Error(`Product query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: new BaseSkuNotFoundError(input.id).message,
          });
        }

        console.log('[getBaseProductById] Fetching hero image');
        let hero;
        try {
          [hero] = await db
            .select({ r2Key: baseSkuMockups.r2Key })
            .from(baseSkuMockups)
            .where(
              and(
                eq(baseSkuMockups.baseSkuId, input.id),
                eq(baseSkuMockups.purpose, "display_card"),
              ),
            )
            .limit(1);
          console.log('[getBaseProductById] Hero image found:', !!hero);
        } catch (err) {
          console.error('[getBaseProductById] Hero image query failed:', err);
          hero = null; // Non-fatal
        }

        // Colors
        console.log('[getBaseProductById] Fetching color attribute');
        let colorAttr;
        try {
          [colorAttr] = await db
            .select({ id: attributes.id })
            .from(attributes)
            .where(eq(attributes.code, "color"))
            .limit(1);
          console.log('[getBaseProductById] Color attribute found:', colorAttr?.id);
        } catch (err) {
          console.error('[getBaseProductById] Color attribute query failed:', err);
          colorAttr = null;
        }

        let colors:
          | Array<{ id: string; hexColor: string; displayName: string }>
          | undefined;
        let totalColors = 0;

        if (colorAttr) {
          console.log('[getBaseProductById] Fetching color rule');
          let rule;
          try {
            [rule] = await db
              .select({ valueSetId: baseSkuAttributeRules.valueSetId })
              .from(baseSkuAttributeRules)
              .where(
                and(
                  eq(baseSkuAttributeRules.baseSkuId, input.id),
                  eq(baseSkuAttributeRules.attributeId, colorAttr.id),
                ),
              )
              .limit(1);
            console.log('[getBaseProductById] Color rule found:', rule?.valueSetId);
          } catch (err) {
            console.error('[getBaseProductById] Color rule query failed:', err);
            rule = null;
          }

          if (rule?.valueSetId) {
            console.log('[getBaseProductById] Fetching color values');
            let all;
            try {
              all = await db
                .select({
                  id: attributeValues.id,
                  hexColor: attributeValues.hexColor,
                  displayName: attributeValues.displayName,
                  sortOrder: attributeValues.sortOrder,
                })
                .from(attributeValueSetMembers)
                .innerJoin(
                  attributeValues,
                  eq(attributeValueSetMembers.valueId, attributeValues.id),
                )
                .where(eq(attributeValueSetMembers.valueSetId, rule.valueSetId))
                .orderBy(attributeValues.sortOrder);
              console.log(`[getBaseProductById] Found ${all.length} colors`);
            } catch (err) {
              console.error('[getBaseProductById] Color values query failed:', err);
              throw new Error(`Color values query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }

            totalColors = all.length;
            colors = all.slice(0, 10).map((c) => ({
              id: c.id,
              hexColor: c.hexColor ?? "#000000",
              displayName: c.displayName,
            }));
          }
        }

        // Fit & material (alias)
        console.log('[getBaseProductById] Fetching fit/material attributes');
        const jValues = alias(attributeValues, "j_values_product");
        let rows;
        try {
          rows = await db
            .select({
              attributeCode: attributes.code,
              displayName: sql<string>`coalesce(${attributeValues.displayName}, ${jValues.displayName})`,
            })
            .from(baseSkuAttributeRules)
            .innerJoin(attributes, eq(baseSkuAttributeRules.attributeId, attributes.id))
            .leftJoin(attributeValues, eq(baseSkuAttributeRules.valueId, attributeValues.id))
            .leftJoin(attributeValueSets, eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id))
            .leftJoin(
              attributeValueSetMembers,
              eq(attributeValueSets.id, attributeValueSetMembers.valueSetId),
            )
            .leftJoin(jValues, eq(attributeValueSetMembers.valueId, jValues.id))
            .where(
              and(
                eq(baseSkuAttributeRules.baseSkuId, input.id),
                eq(baseSkuAttributeRules.isVariantDefining, false),
                inArray(attributes.code, ["fit", "material"]),
              ),
            )
            .orderBy(attributes.code);
          console.log(`[getBaseProductById] Found ${rows.length} attribute entries`);
        } catch (err) {
          console.error('[getBaseProductById] Attributes query failed:', err);
          throw new Error(`Attributes query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        const dedup = new Set<string>();
        const ordered: string[] = [];
        for (const r of rows) {
          if (!r.displayName) continue;
          const key = `${r.attributeCode}:${r.displayName}`;
          if (dedup.has(key)) continue;
          dedup.add(key);
          if (r.attributeCode === "fit") ordered.unshift(r.displayName);
          else if (r.attributeCode === "material") ordered.push(r.displayName);
        }

        const result = {
          id: product.id,
          code: product.code,
          name: product.name,
          attributes: ordered,
          cost: product.cost.toString(),
          category: {
            id: product.categoryId,
            name: product.categoryName,
            slug: product.categorySlug,
          },
          colors: colors ?? [],
          totalColors,
          heroImageUrl: hero ? getPublicUrl(hero.r2Key) : "",
        };
        
        console.log(`[getBaseProductById] Success! Returning product ${product.name} in ${Date.now() - startTime}ms`);
        return result;
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[getBaseProductById] FAILED after ${elapsed}ms:`, {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : undefined,
          productId: input.id,
        });
        
        if (err instanceof TRPCError) throw err;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch product: ${err instanceof Error ? err.message : 'Unknown error'}`,
          cause: err,
        });
      }
    }),

  getEditorData: publicProcedure
    .input(z.object({ baseSkuId: z.uuid() }))
    .query(async ({ input }) => {
      const startTime = Date.now();
      console.log('[getEditorData] Starting with baseSkuId:', input.baseSkuId);
      
      try {
        // Get base SKU details
        console.log('[getEditorData] Fetching base SKU details');
        let baseSku;
        try {
          [baseSku] = await db
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
            .where(and(eq(baseSkus.id, input.baseSkuId), eq(baseSkus.status, "active")))
            .limit(1);
          
          console.log('[getEditorData] Base SKU found:', baseSku ? baseSku.name : 'NOT FOUND');
        } catch (err) {
          console.error('[getEditorData] Base SKU query failed:', err);
          throw new Error(`Base SKU query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        if (!baseSku) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: new BaseSkuNotFoundError(input.baseSkuId).message,
          });
        }

        // Get views with print areas
        console.log('[getEditorData] Fetching views and print areas');
        let viewsData;
        try {
          viewsData = await db
            .select({
              viewId: baseSkuViews.id,
              viewCode: baseSkuViews.code,
              viewDisplayName: baseSkuViews.displayName,
              viewOrder: baseSkuViews.order,
              sourceWidthPx: baseSkuViews.sourceWidthPx,
              sourceHeightPx: baseSkuViews.sourceHeightPx,
              printAreaId: baseSkuPrintAreas.id,
              printAreaXPx: baseSkuPrintAreas.xPx,
              printAreaYPx: baseSkuPrintAreas.yPx,
              printAreaWidthPx: baseSkuPrintAreas.widthPx,
              printAreaHeightPx: baseSkuPrintAreas.heightPx,
              printAreaSourceWidthPx: baseSkuPrintAreas.sourceWidthPx,
              printAreaSourceHeightPx: baseSkuPrintAreas.sourceHeightPx,
              printAreaDpi: baseSkuPrintAreas.dpi,
            })
            .from(baseSkuViews)
            .leftJoin(
              baseSkuPrintAreas,
              eq(baseSkuViews.id, baseSkuPrintAreas.viewId)
            )
            .where(eq(baseSkuViews.baseSkuId, input.baseSkuId))
            .orderBy(baseSkuViews.order);
          
          console.log(`[getEditorData] Found ${viewsData.length} view entries`);
        } catch (err) {
          console.error('[getEditorData] Views query failed:', err);
          throw new Error(`Views query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        // Get editor background mockups
        console.log('[getEditorData] Fetching editor mockups');
        let mockupsData;
        try {
          mockupsData = await db
            .select({
              viewId: baseSkuMockups.viewId,
              r2Key: baseSkuMockups.r2Key,
            })
            .from(baseSkuMockups)
            .where(
              and(
                eq(baseSkuMockups.baseSkuId, input.baseSkuId),
                eq(baseSkuMockups.purpose, "editor_background")
              )
            );
          
          console.log(`[getEditorData] Found ${mockupsData.length} editor mockups`);
        } catch (err) {
          console.error('[getEditorData] Mockups query failed:', err);
          throw new Error(`Mockups query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        // Get colors for this base SKU
        console.log('[getEditorData] Fetching colors');
        let colorAttr;
        try {
          [colorAttr] = await db
            .select({ id: attributes.id })
            .from(attributes)
            .where(eq(attributes.code, "color"))
            .limit(1);
          console.log('[getEditorData] Color attribute found:', colorAttr?.id);
        } catch (err) {
          console.error('[getEditorData] Color attribute query failed:', err);
          colorAttr = null;
        }

        let colors: Array<{ id: string; hexColor: string; displayName: string }> = [];
        
        if (colorAttr) {
          try {
            const colorRows = await db
              .select({
                colorId: attributeValues.id,
                hexColor: attributeValues.hexColor,
                displayName: attributeValues.displayName,
                sortOrder: attributeValues.sortOrder,
              })
              .from(baseSkuAttributeRules)
              .innerJoin(
                attributeValueSets,
                eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id)
              )
              .innerJoin(
                attributeValueSetMembers,
                eq(attributeValueSets.id, attributeValueSetMembers.valueSetId)
              )
              .innerJoin(
                attributeValues,
                eq(attributeValueSetMembers.valueId, attributeValues.id)
              )
              .where(
                and(
                  eq(baseSkuAttributeRules.baseSkuId, input.baseSkuId),
                  eq(baseSkuAttributeRules.attributeId, colorAttr.id)
                )
              )
              .orderBy(attributeValues.sortOrder);

            colors = colorRows.map((c) => ({
              id: c.colorId,
              hexColor: c.hexColor ?? "#000000",
              displayName: c.displayName,
            }));
            
            console.log(`[getEditorData] Found ${colors.length} colors`);
          } catch (err) {
            console.error('[getEditorData] Colors query failed:', err);
            colors = [];
          }
        }

        // Transform views data
        const viewsMap = new Map();
        const mockupsMap = new Map(mockupsData.map(m => [m.viewId, m.r2Key]));

        for (const row of viewsData) {
          if (!viewsMap.has(row.viewId)) {
            viewsMap.set(row.viewId, {
              id: row.viewId,
              code: row.viewCode,
              displayName: row.viewDisplayName,
              order: row.viewOrder,
              sourceWidthPx: row.sourceWidthPx,
              sourceHeightPx: row.sourceHeightPx,
              mockupImageUrl: mockupsMap.get(row.viewId) ? getPublicUrl(mockupsMap.get(row.viewId)!) : null,
              printArea: null,
            });
          }

          if (row.printAreaId) {
            viewsMap.get(row.viewId).printArea = {
              id: row.printAreaId,
              xPx: row.printAreaXPx,
              yPx: row.printAreaYPx,
              widthPx: row.printAreaWidthPx,
              heightPx: row.printAreaHeightPx,
              sourceWidthPx: row.printAreaSourceWidthPx,
              sourceHeightPx: row.printAreaSourceHeightPx,
              dpi: row.printAreaDpi,
            };
          }
        }

        const views = Array.from(viewsMap.values()).sort((a, b) => a.order - b.order);

        const result = {
          baseSku: {
            id: baseSku.id,
            code: baseSku.code,
            name: baseSku.name,
            cost: baseSku.cost.toString(),
            category: {
              id: baseSku.categoryId,
              name: baseSku.categoryName,
              slug: baseSku.categorySlug,
            },
          },
          views,
          colors,
        };

        console.log(`[getEditorData] Success! Returning editor data for ${baseSku.name} in ${Date.now() - startTime}ms`);
        return result;
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[getEditorData] FAILED after ${elapsed}ms:`, {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : undefined,
          baseSkuId: input.baseSkuId,
        });
        
        if (err instanceof TRPCError) throw err;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch editor data: ${err instanceof Error ? err.message : 'Unknown error'}`,
          cause: err,
        });
      }
    }),
});
