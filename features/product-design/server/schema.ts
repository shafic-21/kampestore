import { z } from "zod";

export const productSearchFiltersSchema = z.object({
  query: z.string().default(""),
  category: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  excludeIds: z.array(z.string()).optional(),
});

const mockupInputSchema = z.object({
  designR2Key: z.string(),
  templateR2Key: z.string(),
  backgroundColor: z.string(),
  templateSize: z.object({
    width: z.number(),
    height: z.number(),
  }),
  printArea: z.object({
    x_px: z.number(),
    y_px: z.number(),
    width_px: z.number(),
    height_px: z.number(),
    dpi: z.number(),
  }),
  placement: z.object({
    left: z.number(),
    top: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
    relativeMidXOffset: z.number(),
    relativeMidYOffset: z.number(),
  }),
  outputFormat: z.enum(["png", "webp"]).optional(),
  quality: z.number().min(1).max(100).optional(),
});

const bulkMockupInputSchema = z.object({
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
  variants: z.array(
    z.object({
      id: z.string(),
      templateR2Key: z.string(),
      backgroundColor: z.string(),
      templateSize: z.object({
        width: z.number(),
        height: z.number(),
      }),
      printArea: z.object({
        x_px: z.number(),
        y_px: z.number(),
        width_px: z.number(),
        height_px: z.number(),
        dpi: z.number(),
      }),
    }),
  ),
});


export type ProductSearchFilters = z.infer<typeof productSearchFiltersSchema>;

export { bulkMockupInputSchema, mockupInputSchema };
