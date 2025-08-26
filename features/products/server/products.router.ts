import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/trpc/init";
import { productSearchFiltersSchema } from "../schema";
import { generateMockProducts, generateMockCategories } from "../lib/utils";
import { db } from "@/server/db";
import { baseSkus, baseSkuAttributeRules } from "@/server/db/schema/bases";
import { categories, attributes, attributeValues, attributeValueSets } from "@/server/db/schema/catalog";
import { editorTemplates, baseSkuSwatches } from "@/server/db/schema/mockups";
import { getPublicUrl } from "@/lib/r2";
import { eq, and, sql, inArray } from "drizzle-orm";
import type { ProductSelectionData, BaseProductCard } from "../types";

export const productsRouter = createTRPCRouter({
  // Get base SKUs from database
  getBaseSkus: publicProcedure
    .query(async ({ ctx }) => {
      const baseSkuData = await db
        .select({
          id: baseSkus.id,
          code: baseSkus.code,
          name: baseSkus.name,
          cost: baseSkus.cost,
          categoryId: baseSkus.categoryId,
          categoryName: categories.name,
          categorySlug: categories.slug,
          heroImageR2Key: sql<string>`(
            SELECT et.r2_key 
            FROM editor_templates et 
            WHERE et.base_sku_id = ${baseSkus.id} 
            AND et.render_type = 'blend' 
            LIMIT 1
          )`,
        })
        .from(baseSkus)
        .innerJoin(categories, eq(baseSkus.categoryId, categories.id))
        .where(eq(baseSkus.status, "active"));

      // Get colors for each base SKU
      const baseSkuIds = baseSkuData.map(b => b.id);
      const colorData = await db
        .select({
          baseSkuId: baseSkuSwatches.baseSkuId,
          colorId: baseSkuSwatches.colorValueId,
          hexColor: attributeValues.hexColor,
          displayName: attributeValues.displayName,
        })
        .from(baseSkuSwatches)
        .innerJoin(attributeValues, eq(baseSkuSwatches.colorValueId, attributeValues.id))
        .where(inArray(baseSkuSwatches.baseSkuId, baseSkuIds));

      // Group colors by base SKU
      const colorsByBaseSku = colorData.reduce((acc, color) => {
        if (!acc[color.baseSkuId]) {
          acc[color.baseSkuId] = [];
        }
        acc[color.baseSkuId].push({
          id: color.colorId,
          hexColor: color.hexColor,
          displayName: color.displayName,
        });
        return acc;
      }, {} as Record<string, Array<{ id: string; hexColor: string; displayName: string }>>);

      // Format the response
      const products: BaseProductCard[] = baseSkuData.map((baseSku) => ({
        id: baseSku.id,
        code: baseSku.code,
        name: baseSku.name,
        description: `High-quality ${baseSku.categoryName.toLowerCase()} for custom printing`,
        cost: baseSku.cost,
        category: {
          id: baseSku.categoryId,
          name: baseSku.categoryName,
          slug: baseSku.categorySlug,
        },
        colors: colorsByBaseSku[baseSku.id] || [],
        totalColors: colorsByBaseSku[baseSku.id]?.length || 0,
        heroImageUrl: baseSku.heroImageR2Key ? getPublicUrl(baseSku.heroImageR2Key) : '',
      }));

      return products;
    }),

  // List base products with search and filtering
  listBaseProducts: publicProcedure
    .input(productSearchFiltersSchema)
    .query(async ({ input }) => {
      // Mock implementation - in production, this would query the database
      const allProducts = generateMockProducts();
      const categories = generateMockCategories();
      
      let filteredProducts = allProducts;

      // Apply search filter
      if (input.query) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(input.query.toLowerCase()) ||
          product.description.toLowerCase().includes(input.query.toLowerCase()) ||
          product.code.toLowerCase().includes(input.query.toLowerCase())
        );
      }

      // Apply category filter
      if (input.category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category.slug === input.category
        );
      }

      // Apply pagination
      const startIndex = (input.page - 1) * input.limit;
      const endIndex = startIndex + input.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      const totalPages = Math.ceil(filteredProducts.length / input.limit);

      return {
        products: paginatedProducts,
        categories,
        totalProducts: allProducts.length,
        currentPage: input.page,
        totalPages,
        hasNextPage: input.page < totalPages,
        hasPreviousPage: input.page > 1,
      };
    }),

  // Get all product categories
  getProductCategories: publicProcedure
    .query(async () => {
      // Mock implementation - in production, this would query the categories table
      return generateMockCategories();
    }),

  // Get base product by ID (for future use)
  getBaseProductById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Mock implementation - in production, this would query the database
      const products = generateMockProducts();
      const product = products.find(p => p.id === input.id);
      
      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    }),

  // Get product selection page data
  getProductSelectionData: publicProcedure
    .input(productSearchFiltersSchema.optional())
    .query(async ({ input = {} }) => {
      const filters = {
        query: "",
        page: 1,
        limit: 20,
        ...input,
      };

      // Get real products from database
      const products = await db
        .select({
          id: baseSkus.id,
          code: baseSkus.code,
          name: baseSkus.name,
          cost: baseSkus.cost,
          categoryId: baseSkus.categoryId,
          categoryName: categories.name,
          categorySlug: categories.slug,
          heroImageR2Key: sql<string>`(
            SELECT et.r2_key 
            FROM editor_templates et 
            WHERE et.base_sku_id = ${baseSkus.id} 
            AND et.render_type = 'blend' 
            LIMIT 1
          )`,
        })
        .from(baseSkus)
        .innerJoin(categories, eq(baseSkus.categoryId, categories.id))
        .where(eq(baseSkus.status, "active"));

      // Get colors for each base SKU
      const baseSkuIds = products.map(p => p.id);
      const colorData = await db
        .select({
          baseSkuId: baseSkuSwatches.baseSkuId,
          colorId: baseSkuSwatches.colorValueId,
          hexColor: attributeValues.hexColor,
          displayName: attributeValues.displayName,
        })
        .from(baseSkuSwatches)
        .innerJoin(attributeValues, eq(baseSkuSwatches.colorValueId, attributeValues.id))
        .where(inArray(baseSkuSwatches.baseSkuId, baseSkuIds));

      // Group colors by base SKU
      const colorsByBaseSku = colorData.reduce((acc, color) => {
        if (!acc[color.baseSkuId]) {
          acc[color.baseSkuId] = [];
        }
        acc[color.baseSkuId].push({
          id: color.colorId,
          hexColor: color.hexColor,
          displayName: color.displayName,
        });
        return acc;
      }, {} as Record<string, Array<{ id: string; hexColor: string; displayName: string }>>);

      // Format products
      const formattedProducts: BaseProductCard[] = products.map((product) => ({
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
        colors: colorsByBaseSku[product.id] || [],
        totalColors: colorsByBaseSku[product.id]?.length || 0,
        heroImageUrl: product.heroImageR2Key ? getPublicUrl(product.heroImageR2Key) : '',
      }));

      // Get real categories from database
      const categoryData = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          imageUrl: sql<string>`''`, // Add image URL when available
          productCount: sql<number>`(
            SELECT COUNT(*) 
            FROM base_skus bs 
            WHERE bs.category_id = ${categories.id} 
            AND bs.status = 'active'
          )`,
        })
        .from(categories)
        .where(sql`${categories.level} = 0`); // Only top-level categories

      const data: ProductSelectionData = {
        products: formattedProducts,
        categories: categoryData,
        totalProducts: formattedProducts.length,
        currentPage: filters.page,
        totalPages: Math.ceil(formattedProducts.length / filters.limit),
      };

      return data;
    }),
});