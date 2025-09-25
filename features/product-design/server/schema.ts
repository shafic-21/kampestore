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

const publishListingSchema = z.object({
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
					colors: z.array(z.uuid()).min(1, "At least one color is required"),
					featuredColorId: z.uuid().nullable(),
					sizes: z.array(
						z.object({
							id: z.string(),
							code: z.string(),
							displayName: z.string(),
						}),
					),
					baseViews: z.record(
						z.string(),
						z.object({
							id: z.string(),
							code: z.string(),
							displayName: z.string(),
							printArea: z.object({
								x_px: z.number(),
								y_px: z.number(),
								width_px: z.number(),
								height_px: z.number(),
								dpi: z.number(),
							}),
							template: z.object({
								url: z.string(),
								sourceWidthPx: z.number(),
								sourceHeightPx: z.number(),
							}),
						}),
					),
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
});

export type ProductSearchFilters = z.infer<typeof productSearchFiltersSchema>;

export { bulkMockupInputSchema, mockupInputSchema, publishListingSchema };
