import { z } from "zod";

export const productSearchFiltersSchema = z.object({
	query: z.string().default(""),
	category: z.string().optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(50).default(20),
});

export const baseProductListSchema = z.object({
	filters: productSearchFiltersSchema,
});

export type ProductSearchFilters = z.infer<typeof productSearchFiltersSchema>;
export type BaseProductListInput = z.infer<typeof baseProductListSchema>;
