import { z } from "zod";

/**
 * Typed query-param contract for the seller products table.
 * Keep this in sync with the columns you actually let the user sort by.
 */
export const productOffersQuerySchema = z
	.object({
		page: z.coerce.number().int().min(1).default(1),
		pageSize: z.coerce.number().int().min(1).max(100).default(10),

		sort: z
			.enum([
				"createdAt", // ⇢ “Date added” in the UI
				"productName", // ⇢ “Name”
				"price", // ⇢ “Price (UGX)”
				"stock", // ⇢ “Available”
			])
			.default("createdAt"),
		order: z.enum(["asc", "desc"]).default("desc"),

		search: z.string().trim().max(150).optional(), // free-text
		status: z
			.array(
				z.enum([
					"draft",
					"pending_approval",
					"approved",
					"rejected",
					"active",
					"inactive",
					"out_of_stock",
					"discontinued",
				]),
			)
			.optional(),
		categoryId: z.string().uuid().optional(),
		stockMin: z.coerce.number().int().nonnegative().optional(),
		stockMax: z.coerce.number().int().nonnegative().optional(),
	})
	.refine((v) => !v.stockMin || !v.stockMax || v.stockMin <= v.stockMax, {
		message: "stockMin must be ≤ stockMax",
		path: ["stockMin"],
	});

export type ProductOffersQueryInput = z.infer<typeof productOffersQuerySchema>;
