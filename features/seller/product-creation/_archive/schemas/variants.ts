import { z } from "zod";

export const variantAttributeSchema = z.object({
	attributeId: z.string().uuid(),
	attributeCode: z.string(),
	attributeName: z.string(),
	values: z.array(z.string().min(1)).min(1, "At least one value required"),
});

export const variantCombinationSchema = z.object({
	attributes: z.record(z.string()),
	sku: z.string().min(1, "SKU required"),
	gtin: z.string().optional(),
	weight: z.number().positive("Weight must be positive").optional(),
	dimensions: z
		.object({
			length: z.number().positive().optional(),
			width: z.number().positive().optional(),
			height: z.number().positive().optional(),
			unit: z.enum(["cm", "inch"]).default("cm"),
		})
		.optional(),
	specificationsOverride: z
		.array(
			z.object({
				attributeId: z.string().uuid(),
				attributeCode: z.string(),
				attributeName: z.string(),
				value: z.string(),
				unit: z.string().optional().nullable(),
			}),
		)
		.optional(),
	isDefault: z.boolean().default(false),
});

export const variantsStepSchema = z.object({
	variantDefiningAttributes: z
		.array(variantAttributeSchema)
		.min(1, "At least one defining attribute required")
		.max(5, "Maximum 5 defining attributes allowed"),
	variants: z
		.array(variantCombinationSchema)
		.min(1, "At least one variant required")
		.refine(
			(variants) => variants.filter((v) => v.isDefault).length === 1,
			"Exactly one variant must be marked as default",
		),
});

export type VariantsStepInput = z.infer<typeof variantsStepSchema>;
export type VariantCombination = z.infer<typeof variantCombinationSchema>;
