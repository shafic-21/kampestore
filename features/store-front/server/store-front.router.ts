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
import { eq, and, like, desc, count, sql, isNotNull, inArray, not } from "drizzle-orm";
import { getPublicUrl } from "@/lib/r2";

export const storeFrontRouter = createTRPCRouter({
  getProductDetails: publicProcedure
    .input(z.object({
      storeSlug: z.string(),
      listingSlug: z.string(),
      productId: z.string().optional(),
      variantId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      console.log(`[getProductDetails] Starting query for ${input.storeSlug}/${input.listingSlug}`);

      // First, find the listing
      const listing = await db
        .select({
          id: creatorListings.id,
          title: creatorListings.title,
          slug: creatorListings.slug,
          frontDesignR2Key: creatorListings.frontDesignR2Key,
          backDesignR2Key: creatorListings.backDesignR2Key,
          status: creatorListings.status,
          storeName: stores.storeName,
          storeSlug: stores.storeSlug,
        })
        .from(creatorListings)
        .innerJoin(creators, eq(creatorListings.creatorId, creators.id))
        .innerJoin(stores, eq(creators.id, stores.creatorId))
        .where(and(
          eq(stores.storeSlug, input.storeSlug),
          eq(creatorListings.slug, input.listingSlug),
          eq(stores.status, "active"),
          eq(creatorListings.status, "published")
        ))
        .limit(1);

      if (!listing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product listing not found"
        });
      }

      const listingData = listing[0];

      // Get all products in this listing
      const productList = await db
        .select({
          id: products.id,
          baseSkuId: products.baseSkuId,
          price: products.price,
          baseName: baseSkus.name,
          categoryName: categories.name,
          frontPlacement: products.frontPlacement,
          backPlacement: products.backPlacement,
        })
        .from(products)
        .innerJoin(baseSkus, eq(products.baseSkuId, baseSkus.id))
        .innerJoin(categories, eq(baseSkus.categoryId, categories.id))
        .where(eq(products.listingId, listingData.id));

      if (productList.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No products found for this listing"
        });
      }

      // If productId is specified, filter to that product, otherwise use the first one
      let selectedProduct = productList[0];
      if (input.productId) {
        const foundProduct = productList.find(p => p.id === input.productId);
        if (foundProduct) {
          selectedProduct = foundProduct;
        }
      }

      // Get all variants for the selected product
      const variants = await db
        .select({
          id: productVariants.id,
          sku: productVariants.sku,
          comboHash: productVariants.comboHash,
          price: productVariants.price,
          primaryMockupR2Key: productVariants.primaryMockupR2Key,
          secondaryMockupR2Key: productVariants.secondaryMockupR2Key,
          attributeId: attributes.id,
          attributeCode: attributes.code,
          attributeName: attributes.name,
          attributeValueId: attributeValues.id,
          attributeValueDisplayName: attributeValues.displayName,
          attributeValueHexColor: attributeValues.hexColor,
        })
        .from(productVariants)
        .innerJoin(variantAttributeValues, eq(productVariants.id, variantAttributeValues.variantId))
        .innerJoin(attributes, eq(variantAttributeValues.attributeId, attributes.id))
        .innerJoin(attributeValues, eq(variantAttributeValues.attributeValueId, attributeValues.id))
        .where(eq(productVariants.productId, selectedProduct.id))
        .orderBy(productVariants.sku);

      // Group variants by variant ID and organize attributes
      const variantMap = new Map();
      variants.forEach(variant => {
        if (!variantMap.has(variant.id)) {
          variantMap.set(variant.id, {
            id: variant.id,
            sku: variant.sku,
            comboHash: variant.comboHash,
            price: variant.price,
            primaryMockupR2Key: variant.primaryMockupR2Key,
            secondaryMockupR2Key: variant.secondaryMockupR2Key,
            attributes: new Map(),
          });
        }

        const variantData = variantMap.get(variant.id);
        variantData.attributes.set(variant.attributeCode, {
          id: variant.attributeValueId,
          displayName: variant.attributeValueDisplayName,
          hexColor: variant.attributeValueHexColor,
        });
      });

      // Convert to array and format attributes
      const formattedVariants = Array.from(variantMap.values()).map(variant => ({
        ...variant,
        attributes: Object.fromEntries(variant.attributes),
        price: variant.price ? Number(variant.price) : Number(selectedProduct.price),
      }));

      // Select the variant based on variantId or first one
      let selectedVariant = formattedVariants[0];
      if (input.variantId) {
        const foundVariant = formattedVariants.find(v => v.id === input.variantId);
        if (foundVariant) {
          selectedVariant = foundVariant;
        }
      }

      // Get available attributes for this product
      const availableAttributes = await db
        .select({
          id: attributes.id,
          code: attributes.code,
          name: attributes.name,
          values: sql<{id: string; displayName: string; hexColor: string | null}[]>`
            json_agg(
              json_build_object(
                'id', ${attributeValues.id},
                'displayName', ${attributeValues.displayName},
                'hexColor', ${attributeValues.hexColor}
              ) ORDER BY ${attributeValues.displayName}
            )
          `,
        })
        .from(attributes)
        .innerJoin(variantAttributeValues, eq(attributes.id, variantAttributeValues.attributeId))
        .innerJoin(attributeValues, eq(variantAttributeValues.attributeValueId, attributeValues.id))
        .innerJoin(productVariants, eq(variantAttributeValues.variantId, productVariants.id))
        .where(eq(productVariants.productId, selectedProduct.id))
        .groupBy(attributes.id, attributes.code, attributes.name);

      // Get variant images for selected variant
      const variantImages: string[] = [];
      if (selectedVariant.primaryMockupR2Key) {
        variantImages.push(getPublicUrl(selectedVariant.primaryMockupR2Key));
      }
      if (selectedVariant.secondaryMockupR2Key) {
        variantImages.push(getPublicUrl(selectedVariant.secondaryMockupR2Key));
      }

      // Get default mockups for this base if no variant images
      if (variantImages.length === 0) {
        const defaultMockups = await db
          .select({
            r2Key: baseSkuMockups.r2Key,
            viewCode: baseSkuViews.code,
          })
          .from(baseSkuMockups)
          .innerJoin(baseSkuViews, eq(baseSkuMockups.viewId, baseSkuViews.id))
          .where(and(
            eq(baseSkuMockups.baseSkuId, selectedProduct.baseSkuId),
            eq(baseSkuMockups.purpose, "display_card")
          ))
          .orderBy(baseSkuViews.code);

        defaultMockups.forEach(mockup => {
          variantImages.push(getPublicUrl(mockup.r2Key));
        });
      }

      return {
        listing: {
          id: listingData.id,
          title: listingData.title,
          slug: listingData.slug,
          storeName: listingData.storeName,
          storeSlug: listingData.storeSlug,
        },
        product: {
          id: selectedProduct.id,
          baseSkuId: selectedProduct.baseSkuId,
          baseName: selectedProduct.baseName,
          categoryName: selectedProduct.categoryName,
          price: Number(selectedProduct.price),
        },
        selectedVariant,
        variants: formattedVariants,
        availableAttributes,
        images: variantImages,
        allProducts: productList.map(p => ({
          id: p.id,
          baseSkuId: p.baseSkuId,
          baseName: p.baseName,
          price: Number(p.price),
        })),
      };
    }),

  getRelatedProducts: publicProcedure
    .input(z.object({
      storeSlug: z.string(),
      listingId: z.string(),
      currentProductId: z.string(),
      limit: z.number().min(1).max(20).default(4),
    }))
    .query(async ({ input }) => {
      // Get other products in the same listing
      const relatedProducts = await db
        .select({
          productId: products.id,
          listingTitle: creatorListings.title,
          listingSlug: creatorListings.slug,
          baseName: baseSkus.name,
          price: products.price,
        })
        .from(products)
        .innerJoin(creatorListings, eq(products.listingId, creatorListings.id))
        .innerJoin(baseSkus, eq(products.baseSkuId, baseSkus.id))
        .innerJoin(creators, eq(creatorListings.creatorId, creators.id))
        .innerJoin(stores, eq(creators.id, stores.creatorId))
        .where(and(
          eq(stores.storeSlug, input.storeSlug),
          eq(products.listingId, input.listingId),
          not(eq(products.id, input.currentProductId)),
          eq(stores.status, "active"),
          eq(creatorListings.status, "published")
        ))
        .limit(input.limit);

      // Get images for each product
      const productIds = relatedProducts.map(p => p.productId);
      if (productIds.length === 0) return [];

      const variants = await db
        .select({
          productId: productVariants.productId,
          primaryMockupR2Key: productVariants.primaryMockupR2Key,
        })
        .from(productVariants)
        .where(and(
          inArray(productVariants.productId, productIds),
          isNotNull(productVariants.primaryMockupR2Key)
        ));

      const variantsByProduct = new Map();
      variants.forEach(variant => {
        if (!variantsByProduct.has(variant.productId)) {
          variantsByProduct.set(variant.productId, variant);
        }
      });

      return relatedProducts.map(product => {
        const variant = variantsByProduct.get(product.productId);
        let imageUrl = "https://placehold.co/400x400?text=Product";

        if (variant?.primaryMockupR2Key) {
          imageUrl = getPublicUrl(variant.primaryMockupR2Key);
        }

        return {
          id: product.productId,
          listingTitle: product.listingTitle,
          listingSlug: product.listingSlug,
          baseName: product.baseName,
          price: Number(product.price),
          imageUrl,
        };
      });
    }),

  getRecommendedProducts: publicProcedure
    .input(z.object({
      storeSlug: z.string(),
      currentListingId: z.string(),
      limit: z.number().min(1).max(20).default(4),
    }))
    .query(async ({ input }) => {
      // Get random products from the same store, different listing
      const recommendedProducts = await db
        .select({
          productId: products.id,
          listingTitle: creatorListings.title,
          listingSlug: creatorListings.slug,
          baseName: baseSkus.name,
          price: products.price,
        })
        .from(products)
        .innerJoin(creatorListings, eq(products.listingId, creatorListings.id))
        .innerJoin(baseSkus, eq(products.baseSkuId, baseSkus.id))
        .innerJoin(creators, eq(creatorListings.creatorId, creators.id))
        .innerJoin(stores, eq(creators.id, stores.creatorId))
        .where(and(
          eq(stores.storeSlug, input.storeSlug),
          not(eq(creatorListings.id, input.currentListingId)),
          eq(stores.status, "active"),
          eq(creatorListings.status, "published")
        ))
        .orderBy(sql`RANDOM()`)
        .limit(input.limit);

      // Get images for each product
      const productIds = recommendedProducts.map(p => p.productId);
      if (productIds.length === 0) return [];

      const variants = await db
        .select({
          productId: productVariants.productId,
          primaryMockupR2Key: productVariants.primaryMockupR2Key,
        })
        .from(productVariants)
        .where(and(
          inArray(productVariants.productId, productIds),
          isNotNull(productVariants.primaryMockupR2Key)
        ));

      const variantsByProduct = new Map();
      variants.forEach(variant => {
        if (!variantsByProduct.has(variant.productId)) {
          variantsByProduct.set(variant.productId, variant);
        }
      });

      return recommendedProducts.map(product => {
        const variant = variantsByProduct.get(product.productId);
        let imageUrl = "https://placehold.co/400x400?text=Product";

        if (variant?.primaryMockupR2Key) {
          imageUrl = getPublicUrl(variant.primaryMockupR2Key);
        }

        return {
          id: product.productId,
          listingTitle: product.listingTitle,
          listingSlug: product.listingSlug,
          baseName: product.baseName,
          price: Number(product.price),
          imageUrl,
        };
      });
    }),
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
            listingSlug: product.listingSlug,
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