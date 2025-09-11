import { z } from "zod/v4";

// Store name validation
export const storeNameSchema = z
	.string()
	.min(2, "Store name must be at least 2 characters")
	.max(100, "Store name must be less than 100 characters")
	.regex(
		/^[a-zA-Z0-9\s\-_.&']+$/,
		"Store name can only contain letters, numbers, spaces, hyphens, underscores, periods, ampersands, and apostrophes",
	);

// Creator slug validation (URL-safe, lowercase, no spaces)
export const creatorSlugSchema = z
	.string()
	.min(3, "Creator slug must be at least 3 characters")
	.max(50, "Creator slug must be less than 50 characters")
	.regex(
		/^[a-z0-9-]+$/,
		"Creator slug can only contain lowercase letters, numbers, and hyphens",
	)
	.refine(
		(slug) => !slug.startsWith("-") && !slug.endsWith("-"),
		"Creator slug cannot start or end with a hyphen",
	)
	.refine(
		(slug) => !slug.includes("--"),
		"Creator slug cannot contain consecutive hyphens",
	);

// Complete creator creation schema
export const createCreatorSchema = z.object({
	storeName: storeNameSchema,
	creatorSlug: creatorSlugSchema,
});

// Slug availability check schema
export const checkSlugSchema = z.object({
	slug: creatorSlugSchema,
});

export type CreateCreatorInput = z.infer<typeof createCreatorSchema>;
export type CheckSlugInput = z.infer<typeof checkSlugSchema>;

// Utility function to generate slug from store name
export function generateSlugFromStoreName(storeName: string): string {
	return (
		storeName
			.toLowerCase()
			.trim()
			// Replace spaces and special characters with hyphens
			.replace(/[^a-z0-9]+/g, "-")
			// Remove leading/trailing hyphens
			.replace(/^-+|-+$/g, "")
			// Replace consecutive hyphens with single hyphen
			.replace(/-+/g, "-")
			// Limit length
			.slice(0, 50)
	);
}
