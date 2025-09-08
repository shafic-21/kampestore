import type { CachedProduct } from "../types/store.types";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

// Derive type from tRPC procedure output
type RouterOutput = inferRouterOutputs<AppRouter>;
type ServerEditorData = RouterOutput["productDesign"]["initializeStore"];

/**
 * Transform server editor data to cached product structure for localStorage.
 * Converts arrays to Records and extracts R2 keys from URLs.
 */
export function transformToCache(data: ServerEditorData): CachedProduct {
  const { baseSku } = data;

  const views = baseSku.views.reduce(
    (acc, view) => {
      return {
        ...acc,
        [view.code]: {
          id: view.id,
          code: view.code,
          displayName: view.displayName,
          printArea: {
            x_px: view.printArea.x_px,
            y_px: view.printArea.y_px,
            width_px: view.printArea.width_px,
            height_px: view.printArea.height_px,
            dpi: view.printArea.dpi,
          },
          template: {
            url: view.mockupImageUrl,
            sourceWidthPx: view.sourceWidthPx,
            sourceHeightPx: view.sourceHeightPx,
          },
        },
      };
    },
    {} as CachedProduct["views"],
  );

  const colors = baseSku.colors.reduce(
    (acc, color, index) => {
      return {
        ...acc,
        [color.id]: {
          id: color.id,
          code: color.code,
          displayName: color.displayName,
          hexValue: color.hexColor,
          isDefault: index === 0,
        },
      };
    },
    {} as CachedProduct["colors"],
  );

  return {
    id: baseSku.id,
    code: baseSku.code,
    name: baseSku.name,
    cost: baseSku.cost,
    views,
    colors,
    generatedPreview: null,
  };
}

/**
 * Transform multiple products for bulk catalog updates.
 */
export function transformBulkToCache(
  products: ServerEditorData[],
): Record<string, CachedProduct> {
  return products.reduce((acc, product) => {
    const cached = transformToCache(product);
    return { ...acc, [cached.id]: cached };
  }, {});
}
