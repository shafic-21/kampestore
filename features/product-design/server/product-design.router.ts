import { publicProcedure } from "@/trpc/init";
import { db } from "@/server/db";
import {
  baseSkus,
  baseSkuViews,
  baseSkuPrintAreas,
  baseSkuMockups,
  baseSkuAttributeRules,
} from "@/server/db/schema/bases";
import {
  attributes,
  attributeValues,
  attributeValueSets,
  attributeValueSetMembers,
} from "@/server/db/schema/catalog";
import { eq, and } from "drizzle-orm";
import { getPublicUrl } from "@/lib/r2";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { mockupGeneratorRouter } from "./mockup.router";

export const productDesignRouter = {
  mockup: mockupGeneratorRouter,
  initializeStore: publicProcedure
    .input(z.object({ sku: z.uuid() }))
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        const baseSkuId = input.sku;

        // Base SKU core data (including printSpec)
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

        // Colors: attribute "color" bound via rule value sets
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
};
