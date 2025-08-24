
import { z } from "zod";

export const basicInfoSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(180, "Title must be 180 characters or less"),
    leafCategoryId: z.string().uuid("Please select a valid category"),
    brandId: z.string().uuid("Please select a brand").optional(),
    gtin: z
      .string()
      .max(14, "GTIN cannot exceed 14 characters")
      .optional()
      .refine((val) => !val || /^\d{8,14}$/.test(val), {
        message: "GTIN must be between 8 and 14 digits",
      })
      .transform((val) => val || undefined),
    hasVariants: z.boolean().default(false).optional(),
    // description: z.string().min(10, "Description is too short").optional(),
    highlights: z
      .array(
        z.string().min(2, "Highlight too short").max(100, "Highlight too long")
      )
      .max(10, "Maximum 10 highlights")
      .optional()
      // .default([]),
  })

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
