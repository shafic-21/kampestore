import { publicProcedure } from "@/trpc/init";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/server/db";
import {
  creatorListings,
  products,
  productVariants,
  variantAttributeValues,
} from "@/server/db/schema/products";
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
import { MockupGenerator } from "./mockup-generator";
import {
  getPublicUrl,
  downloadFile,
  uploadFile,
  generateKey,
  R2_PREFIXES,
  deleteR2File,
} from "@/lib/r2";
import type { CachedProduct, NormalizedPlacement } from "../types/store.types";

export const listingProcedure = {
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
                placements: z
                  .record(
                    z.string(), // view code (front/back)
                    z.object({
                      left: z.number(),
                      top: z.number(),
                      width: z.number(),
                      height: z.number(),
                      rotation: z.number(),
                      relativeMidXOffset: z.number(),
                      relativeMidYOffset: z.number(),
                    }),
                  )
                  .optional(),
              }),
            )
            .min(1, "At least one product is required"),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      // Track created resources for cleanup on failure
      let createdListingId: string | null = null;
      const createdProductIds: string[] = [];
      const createdVariantIds: string[] = [];
      const uploadedMockupKeys: string[] = [];

      try {
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

        // Create creator listing (no transaction)
        const [listingRecord] = await db
          .insert(creatorListings)
          .values({
            creatorId: input.creatorId,
            title: input.listing.title,
            slug: slug,
            status: "published",
            publishedAt: new Date(),
            frontDesignR2Key: frontDesign?.designR2Key || null,
            backDesignR2Key: backDesign?.designR2Key || null,
            metaTitle: input.listing.title,
            metaDescription: input.listing.description || null,
          })
          .returning({ id: creatorListings.id });

        createdListingId = listingRecord.id;
        const listingId = listingRecord.id;

        // Process each product in the listing
        for (const productData of input.listing.products) {
          try {
            // Create product record with placement data
            const [productRecord] = await db
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
            createdProductIds.push(productId);

            // Get base SKU data with views and templates
            const baseSkuData = await db
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
            const colorData = await db
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
              try {
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
                if (frontDesign?.designR2Key && frontView?.templateR2Key) {
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
                      placement: productData.placements
                        ?.front as NormalizedPlacement,
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
                    uploadedMockupKeys.push(mockupKey);
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
                        "PUBLIC",
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
                      placement: productData.placements
                        ?.back as NormalizedPlacement,
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
                      `Failed to generate back mockup for ${sku}:`,
                      error,
                    );
                  }
                }

                // Create product variant with mockup keys
                const [variantRecord] = await db
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
                createdVariantIds.push(variantId);

                // Find color attribute ID and link variant to color
                const [colorAttribute] = await db
                  .select({ id: attributes.id })
                  .from(attributes)
                  .where(eq(attributes.code, "color"))
                  .limit(1);

                if (colorAttribute) {
                  await db.insert(variantAttributeValues).values({
                    variantId: variantId,
                    attributeId: colorAttribute.id,
                    attributeValueId: colorId,
                  });
                }
              } catch (variantError) {
                console.error(
                  `Failed to create variant for color ${colorId}:`,
                  variantError,
                );
                // Continue with next variant instead of failing entire listing
              }
            }
          } catch (productError) {
            console.error(
              `Failed to create product ${productData.baseSkuId}:`,
              productError,
            );
            // Continue with next product instead of failing entire listing
          }
        }

        // Check if any products were successfully created
        if (createdProductIds.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create any products for the listing",
          });
        }

        const elapsed = Date.now() - startTime;
        console.log(
          `[publishListing] Success in ${elapsed}ms - listingId=${listingId}`,
        );

        return {
          success: true,
          slug: slug,
        };
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[publishListing] FAILED after ${elapsed}ms`, {
          error: err,
          creatorId: input.creatorId,
          title: input.listing.title,
        });

        // Cleanup on failure
        try {
          // Delete variants
          if (createdVariantIds.length > 0) {
            await db
              .delete(variantAttributeValues)
              .where(
                inArray(variantAttributeValues.variantId, createdVariantIds),
              );

            await db
              .delete(productVariants)
              .where(inArray(productVariants.id, createdVariantIds));
          }

          // Delete products
          if (createdProductIds.length > 0) {
            await db
              .delete(products)
              .where(inArray(products.id, createdProductIds));
          }

          // Delete listing
          if (createdListingId) {
            await db
              .delete(creatorListings)
              .where(eq(creatorListings.id, createdListingId));
          }

          // Delete uploaded mockups from R2
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
        } catch (cleanupError) {
          console.error("Failed to cleanup after error:", cleanupError);
        }

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
            previewImageUrl: row.primaryMockupR2Key ? getPublicUrl(row.primaryMockupR2Key) : null,
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
