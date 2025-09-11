import { z } from "zod";

export const SpecificationItemSchema = z.object({
	attributeId: z.string().uuid("Invalid attribute ID"),
	attributeCode: z.string().min(1, "Attribute code cannot be empty"),
	attributeName: z.string().min(1, "Attribute name cannot be empty"),
	value: z.string(), // Value is stringified by SpecificationInput before being passed to onChange
	unit: z.string().optional().nullable(), // Making unit optional and nullable
});

export const detailsInfoSchema = z.object({
	description: z.string().min(10, "Description is too short").optional(),
	tags: z
		.array(z.string().min(2, "Tag too short").max(100, "Tag too long"))
		.max(10, "Maximum 10 tags allowed.")
		.optional(),
	specifications: z
		.array(SpecificationItemSchema)
		.max(50, "Maximum 50 specifications allowed.") // Added a max limit for specifications array
		.optional(), // Making the whole array optional if no specs are needed
	countryOfOrigin: z
		.string()
		.min(2, "Please select a country")
		.optional()
		.nullable(), // Assuming TCountryCode is a string like "US"
});

export type DetailsInfoInput = z.infer<typeof detailsInfoSchema>;

// Ensure SpecificationItem type is also exported if used elsewhere,
// though it's primarily for the schema's internal structure here.
export type SpecificationItem = z.infer<typeof SpecificationItemSchema>;
