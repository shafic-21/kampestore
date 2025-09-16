import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";
import { db } from "@/server/db";
import {
  creatorListings,
  products,
  productVariants,
  variantAttributeValues
} from "@/server/db/schema/products";
import {
  stores,
  creators
} from "@/server/db/schema/creators";
import {
  baseSkus,
  baseSkuViews,
  baseSkuMockups
} from "@/server/db/schema/bases";
import {
  categories,
  attributes,
  attributeValues
} from "@/server/db/schema/catalog";
import { eq, and, like, desc, count, sql, isNotNull, inArray } from "drizzle-orm";
import { getPublicUrl } from "@/lib/r2";

export const storeFrontRouter = createTRPCRouter({
  getStoreBySlug: publicProcedure
    .input(z.object({
      slug: z.string()
    }))
    .query(async ({ input }) => {
      const store = await db
        .select({
          id: stores.id,
          storeName: stores.storeName,
          storeSlug: stores.storeSlug,
          description: stores.description,
          logoR2Key: stores.logoR2Key,
          bannerR2Key: stores.bannerR2Key,
          bannerAction: stores.bannerAction,
          status: stores.status,
          displaySocialsOnStore: creators.displaySocialsOnStore,
          xUrl: creators.xUrl,
          instagramUrl: creators.instagramUrl,
          facebookUrl: creators.facebookUrl,
          tiktokUrl: creators.tiktokUrl,
        })
        .from(stores)
        .innerJoin(creators, eq(stores.creatorId, creators.id))
        .where(and(
          eq(stores.storeSlug, input.slug),
          eq(stores.status, "active")
        ))
        .limit(1);

      return store[0] || null;
    }),

  getStoreCategories: publicProcedure
    .input(z.object({
      storeSlug: z.string()
    }))
    .query(async ({ input }) => {
      const storeCategories = await db
        .selectDistinct({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .innerJoin(baseSkus, eq(categories.id, baseSkus.categoryId))
        .innerJoin(products, eq(baseSkus.id, products.baseSkuId))
        .innerJoin(creatorListings, eq(products.listingId, creatorListings.id))
        .innerJoin(creators, eq(creatorListings.creatorId, creators.id))
        .innerJoin(stores, eq(creators.id, stores.creatorId))
        .where(and(
          eq(stores.storeSlug, input.storeSlug),
          eq(stores.status, "active"),
          eq(creatorListings.status, "published")
        ))
        .orderBy(categories.name);

      return storeCategories;
    }),

  getStoreProducts: publicProcedure
    .input(z.object({
      storeSlug: z.string(),
      search: z.string().optional(),
      categorySlug: z.string().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(20).default(16),
    }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        console.log(`[getStoreProducts] Starting query for store: ${input.storeSlug}`, {
          search: input.search,
          categorySlug: input.categorySlug,
          page: input.page,
          pageSize: input.pageSize,
        });

        const offset = (input.page - 1) * input.pageSize;

        // Build where conditions
        const whereConditions = [
          eq(stores.storeSlug, input.storeSlug),
          eq(stores.status, "active"),
          eq(creatorListings.status, "published")
        ];

        if (input.search) {
          whereConditions.push(
            like(creatorListings.title, `%${input.search}%`)
          );
        }

        if (input.categorySlug) {
          whereConditions.push(
            eq(categories.slug, input.categorySlug)
          );
        }

        // Get products with listing information
        const rawProducts = await db
          .select({
            listingId: creatorListings.id,
            listingTitle: creatorListings.title,
            listingSlug: creatorListings.slug,
            productId: products.id,
            price: products.price,
            baseName: baseSkus.name,
            baseSkuId: baseSkus.id,
          })
          .from(creatorListings)
          .innerJoin(creators, eq(creatorListings.creatorId, creators.id))
          .innerJoin(stores, eq(creators.id, stores.creatorId))
          .innerJoin(products, eq(creatorListings.id, products.listingId))
          .innerJoin(baseSkus, eq(products.baseSkuId, baseSkus.id))
          .innerJoin(categories, eq(baseSkus.categoryId, categories.id))
          .where(and(...whereConditions))
          .orderBy(desc(creatorListings.publishedAt))
          .limit(input.pageSize)
          .offset(offset);

        if (rawProducts.length === 0) {
          console.log(`[getStoreProducts] No products found for store: ${input.storeSlug}`);
          return {
            products: [],
            pagination: {
              page: input.page,
              pageSize: input.pageSize,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          };
        }

        // Get product IDs for batch queries
        const productIds = rawProducts.map(p => p.productId);
        const baseSkuIds = [...new Set(rawProducts.map(p => p.baseSkuId))];

        // Batch fetch product variants with their colors
        const variants = await db
          .select({
            productId: productVariants.productId,
            variantId: productVariants.id,
            primaryMockupR2Key: productVariants.primaryMockupR2Key,
            colorId: attributeValues.id,
            colorDisplayName: attributeValues.displayName,
            colorHexValue: attributeValues.hexColor,
          })
          .from(productVariants)
          .innerJoin(variantAttributeValues, eq(productVariants.id, variantAttributeValues.variantId))
          .innerJoin(attributeValues, eq(variantAttributeValues.attributeValueId, attributeValues.id))
          .innerJoin(attributes, eq(variantAttributeValues.attributeId, attributes.id))
          .where(and(
            inArray(productVariants.productId, productIds),
            eq(attributes.code, "color")
          ));

        // Get default mockup images for products that don't have variant mockups
        const defaultMockups = await db
          .select({
            baseSkuId: baseSkuMockups.baseSkuId,
            r2Key: baseSkuMockups.r2Key,
            viewId: baseSkuMockups.viewId,
          })
          .from(baseSkuMockups)
          .innerJoin(baseSkuViews, eq(baseSkuMockups.viewId, baseSkuViews.id))
          .where(and(
            inArray(baseSkuMockups.baseSkuId, baseSkuIds),
            eq(baseSkuMockups.purpose, "display_card"),
            eq(baseSkuViews.code, "front")
          ));

        // Group data by product
        const variantsByProduct = new Map<string, typeof variants>();
        const defaultMockupsByBaseSku = new Map<string, string>();

        variants.forEach(variant => {
          if (!variantsByProduct.has(variant.productId)) {
            variantsByProduct.set(variant.productId, []);
          }
          variantsByProduct.get(variant.productId)!.push(variant);
        });

        defaultMockups.forEach(mockup => {
          defaultMockupsByBaseSku.set(mockup.baseSkuId, getPublicUrl(mockup.r2Key));
        });

        // Process products with actual data
        const processedProducts = rawProducts.map(product => {
          const productVariants = variantsByProduct.get(product.productId) || [];

          // Get unique colors for this product
          const uniqueColors = new Map<string, {
            id: string;
            hexValue: string;
            displayName: string;
          }>();

          productVariants.forEach(variant => {
            if (variant.colorId && !uniqueColors.has(variant.colorId)) {
              uniqueColors.set(variant.colorId, {
                id: variant.colorId,
                hexValue: variant.colorHexValue || "#000000",
                displayName: variant.colorDisplayName,
              });
            }
          });

          const colors = Array.from(uniqueColors.values());

          // Get the default image - prefer variant mockup, fallback to default mockup
          let defaultImageUrl = "https://placehold.co/400x400?text=Product";

          const variantWithMockup = productVariants.find(v => v.primaryMockupR2Key);
          if (variantWithMockup?.primaryMockupR2Key) {
            defaultImageUrl = getPublicUrl(variantWithMockup.primaryMockupR2Key);
          } else {
            const defaultMockup = defaultMockupsByBaseSku.get(product.baseSkuId);
            if (defaultMockup) {
              defaultImageUrl = defaultMockup;
            }
          }

          return {
            id: product.productId,
            listingTitle: product.listingTitle,
            baseName: product.baseName,
            price: Number(product.price), // Convert bigint to number for JSON serialization
            defaultImageUrl,
            colors: colors.length > 0 ? colors : [{
              id: "default",
              hexValue: "#000000",
              displayName: "Default",
            }],
            totalColors: colors.length || 1,
          };
        });

        // Get total count for pagination
        const totalCount = await db
          .select({ count: count() })
          .from(creatorListings)
          .innerJoin(creators, eq(creatorListings.creatorId, creators.id))
          .innerJoin(stores, eq(creators.id, stores.creatorId))
          .innerJoin(products, eq(creatorListings.id, products.listingId))
          .innerJoin(baseSkus, eq(products.baseSkuId, baseSkus.id))
          .innerJoin(categories, eq(baseSkus.categoryId, categories.id))
          .where(and(...whereConditions));

        const total = totalCount[0]?.count || 0;
        const totalPages = Math.ceil(total / input.pageSize);

        const elapsed = Date.now() - startTime;
        console.log(`[getStoreProducts] Success in ${elapsed}ms for store: ${input.storeSlug}`, {
          productsFound: processedProducts.length,
          totalProducts: total,
        });

        return {
          products: processedProducts,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages,
            hasNextPage: input.page < totalPages,
            hasPreviousPage: input.page > 1,
          },
        };
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[getStoreProducts] FAILED after ${elapsed}ms`, {
          error: err,
          message: err instanceof Error ? err.message : "Unknown error",
          storeSlug: input.storeSlug,
          stack: err instanceof Error ? err.stack : undefined,
        });

        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch store products",
          cause: err,
        });
      }
    }),
});