import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/trpc/init";
import { productSearchFiltersSchema } from "../schema";
import { db } from "@/server/db";
import {
  baseSkus,
  baseSkuAttributeRules,
  baseSkuMockups
} from "@/server/db/schema/bases";
import {
  categories,
  attributes,
  attributeValues,
  attributeValueSets,
  attributeValueSetMembers
} from "@/server/db/schema/catalog";
import { getPublicUrl } from "@/lib/r2";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import {
    BaseSkuNotFoundError,
    CategoryNotFoundError,
  type BaseProductCard,
  type ProductCategory
} from "../types";

export const baseSkuRouter = createTRPCRouter({
  // List base products with search and filtering
  listBaseProducts: publicProcedure
    .input(productSearchFiltersSchema)
    .query(async ({ input }) => {
      try {
        // Validate category if provided
        if (input.category) {
          const categoryExists = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, input.category))
            .limit(1);
          
          if (!categoryExists[0]) {
            throw new CategoryNotFoundError(input.category);
          }
        }

        // Build conditions
        const conditions = [eq(baseSkus.status, "active")];

        // Add search filter
        if (input.query) {
          conditions.push(
            sql`(
              LOWER(${baseSkus.name}) LIKE LOWER(${'%' + input.query + '%'}) OR
              LOWER(${baseSkus.code}) LIKE LOWER(${'%' + input.query + '%'}) OR
              LOWER(${categories.name}) LIKE LOWER(${'%' + input.query + '%'})
            )`
          );
        }

        // Add category filter
        if (input.category) {
          conditions.push(eq(categories.slug, input.category));
        }

        // Get base SKUs with all filters applied
        const filteredProducts = await db
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
          .where(and(...conditions));



        // Apply pagination
        const startIndex = (input.page - 1) * input.limit;
        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + input.limit);
        const paginatedProductIds = paginatedProducts.map(p => p.id);

        if (paginatedProductIds.length === 0) {
          return {
            products: [],
            categories: [],
            totalProducts: 0,
            currentPage: input.page,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          };
        }

        // Get hero images for paginated products
        const heroImages = await db
          .select({
            baseSkuId: baseSkuMockups.baseSkuId,
            r2Key: baseSkuMockups.r2Key,
          })
          .from(baseSkuMockups)
          .where(
            and(
              inArray(baseSkuMockups.baseSkuId, paginatedProductIds),
              eq(baseSkuMockups.isHero, true)
            )
          );

        // Get color information for paginated products with proper joins
        const colorAttribute = await db
          .select({ id: attributes.id })
          .from(attributes)
          .where(eq(attributes.code, "color"))
          .limit(1);

        let colorsByBaseSku: Record<string, { colors: Array<{ id: string; hexColor: string; displayName: string }>; totalColors: number }> = {};

        if (colorAttribute[0]) {
          // Get colors with proper joins through junction table
          const productColorsData = await db
            .select({
              baseSkuId: baseSkuAttributeRules.baseSkuId,
              valueSetId: baseSkuAttributeRules.valueSetId,
              colorId: attributeValues.id,
              hexColor: attributeValues.hexColor,
              displayName: attributeValues.displayName,
              sortOrder: attributeValues.sortOrder,
            })
            .from(baseSkuAttributeRules)
            .innerJoin(attributeValueSets, eq(baseSkuAttributeRules.valueSetId, attributeValueSets.id))
            .innerJoin(attributeValueSetMembers, eq(attributeValueSets.id, attributeValueSetMembers.valueSetId))
            .innerJoin(attributeValues, eq(attributeValueSetMembers.valueId, attributeValues.id))
            .where(
              and(
                inArray(baseSkuAttributeRules.baseSkuId, paginatedProductIds),
                eq(baseSkuAttributeRules.attributeId, colorAttribute[0].id)
              )
            )
            .orderBy(attributeValues.sortOrder);

          // Group colors by base SKU to prevent cross-contamination
          const colorsByProduct = new Map<string, Array<{ id: string; hexColor: string; displayName: string; sortOrder: number }>>();
          
          for (const colorData of productColorsData) {
            if (!colorsByProduct.has(colorData.baseSkuId)) {
              colorsByProduct.set(colorData.baseSkuId, []);
            }
            colorsByProduct.get(colorData.baseSkuId)!.push({
              id: colorData.colorId,
              hexColor: colorData.hexColor || '#000000',
              displayName: colorData.displayName,
              sortOrder: colorData.sortOrder,
            });
          }

          // Process each product's colors separately
          for (const [baseSkuId, colors] of colorsByProduct) {
            // Sort by sortOrder to ensure consistent ordering
            const sortedColors = colors.sort((a, b) => a.sortOrder - b.sortOrder);
            const top10Colors = sortedColors.slice(0, 10);
            
            colorsByBaseSku[baseSkuId] = {
              colors: top10Colors.map(color => ({
                id: color.id,
                hexColor: color.hexColor,
                displayName: color.displayName,
              })),
              totalColors: colors.length,
            };
          }
        }

        // Get categories for filter options
        const categoriesData = await db
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

        const heroImageMap = heroImages.reduce((acc, img) => {
          acc[img.baseSkuId] = img.r2Key;
          return acc;
        }, {} as Record<string, string>);

        const formattedProducts = paginatedProducts.map((product) => {
          const colorInfo = colorsByBaseSku[product.id];
          return {
            id: product.id,
            code: product.code,
            name: product.name,
            description: `High-quality ${product.categoryName.toLowerCase()} for custom printing`,
            cost: product.cost,
            category: {
              id: product.categoryId,
              name: product.categoryName,
              slug: product.categorySlug,
            },
            colors: colorInfo?.colors || [],
            totalColors: colorInfo?.totalColors || 0,
            heroImageUrl: heroImageMap[product.id] ? getPublicUrl(heroImageMap[product.id]) : '',
          };
        });

        const totalPages = Math.ceil(filteredProducts.length / input.limit);

        return {
          products: formattedProducts,
          categories: categoriesData.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            imageUrl: '', // Ready for future category images
            productCount: cat.productCount,
          })),
          totalProducts: filteredProducts.length,
          currentPage: input.page,
          totalPages,
          hasNextPage: input.page < totalPages,
          hasPreviousPage: input.page > 1,
        };

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search base products",
          cause: error,
        });
      }
    }),

  // Get all product categories
  getProductCategories: publicProcedure
    .query(async () => {
      try {
        const categoriesData = await db
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

        return categoriesData.map((cat): ProductCategory => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          imageUrl: '', // Ready for future category images
          productCount: cat.productCount,
        }));

      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch product categories",
          cause: error,
        });
      }
    }),

  // Get base product by ID
  getBaseProductById: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      try {
        const product = await db
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
          .where(
            and(
              eq(baseSkus.id, input.id),
              eq(baseSkus.status, "active")
            )
          )
          .limit(1);

        if (!product[0]) {
          throw new BaseSkuNotFoundError(input.id);
        }

        // Get hero image
        const heroImage = await db
          .select({ r2Key: baseSkuMockups.r2Key })
          .from(baseSkuMockups)
          .where(
            and(
              eq(baseSkuMockups.baseSkuId, input.id),
              eq(baseSkuMockups.isHero, true)
            )
          )
          .limit(1);

        // Get colors (top 10 + count)
        const colorAttribute = await db
          .select({ id: attributes.id })
          .from(attributes)
          .where(eq(attributes.code, "color"))
          .limit(1);

        let colors: Array<{ id: string; hexColor: string; displayName: string }> = [];
        let totalColors = 0;

        if (colorAttribute[0]) {
          const colorRule = await db
            .select({ valueSetId: baseSkuAttributeRules.valueSetId })
            .from(baseSkuAttributeRules)
            .where(
              and(
                eq(baseSkuAttributeRules.baseSkuId, input.id),
                eq(baseSkuAttributeRules.attributeId, colorAttribute[0].id)
              )
            )
            .limit(1);

          if (colorRule[0]) {
            const allColorData = await db
              .select({
                id: attributeValues.id,
                hexColor: attributeValues.hexColor,
                displayName: attributeValues.displayName,
                sortOrder: attributeValues.sortOrder,
              })
              .from(attributeValueSetMembers)
              .innerJoin(attributeValues, eq(attributeValueSetMembers.valueId, attributeValues.id))
              .where(eq(attributeValueSetMembers.valueSetId, colorRule[0].valueSetId))
              .orderBy(attributeValues.sortOrder);

            totalColors = allColorData.length;
            colors = allColorData.slice(0, 10).map(color => ({
              id: color.id,
              hexColor: color.hexColor || '#000000',
              displayName: color.displayName,
            }));
          }
        }

        const baseProduct = product[0];
        return {
          id: baseProduct.id,
          code: baseProduct.code,
          name: baseProduct.name,
          description: `High-quality ${baseProduct.categoryName.toLowerCase()} for custom printing`,
          cost: baseProduct.cost,
          category: {
            id: baseProduct.categoryId,
            name: baseProduct.categoryName,
            slug: baseProduct.categorySlug,
          },
          colors,
          totalColors,
          heroImageUrl: heroImage[0] ? getPublicUrl(heroImage[0].r2Key) : '',
        };

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch base product",
          cause: error,
        });
      }
    }),
});
