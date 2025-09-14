// features/seller/product-creation/actions/create-draft-product.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { catalogProducts } from "@/lib/db/schema";
import { basicInfoSchema } from "../schemas/basic-info";
import { checkDuplicates } from "@/features/seller/product-creation/_archive/actions/check-duplicates";
import slugify from "slugify";

import { TEST_SELLER_ID } from "@/features/seller/constants";

export type CreateDraftProductResponse = {
	status: "success" | "duplicates" | "error";
	draftId?: string;
	categoryId?: string;
	hasVariants?: boolean;
	duplicates?: { id: string; title: string }[];
	serverError?: string;
};

export const createDraftProduct = actionClient
	.schema(basicInfoSchema)
	.action(async ({ parsedInput, ctx }): Promise<CreateDraftProductResponse> => {
		// const sellerId = ctx.session.sellerId;
		const sellerId = TEST_SELLER_ID;
		console.log("parsedInput", parsedInput);
		// 1. duplicates
		const duplicates = await checkDuplicates(db, parsedInput);
		if (duplicates.length) {
			return { status: "duplicates", duplicates } as const;
		}

		// 2. insert draft
		const [{ id, leafCategoryId }] = await db
			.insert(catalogProducts)
			.values({
				title: parsedInput.title,
				slug: slugify(parsedInput.title), // 🔑 MUST supply slug
				leafCategoryId: parsedInput.leafCategoryId,
				brandId: parsedInput.brandId,
				gtin: parsedInput.gtin,
				// detailedDescription: parsedInput.description, // 👈 renamed
				highlights: parsedInput.highlights,
				hasVariants: parsedInput.hasVariants,
				listingScope: "single_seller",
				lifecycleStatus: "draft",
				creatorSellerId: sellerId,
			})
			.returning({
				id: catalogProducts.id,
				leafCategoryId: catalogProducts.leafCategoryId,
			});

		return {
			status: "success",
			draftId: id,
			categoryId: leafCategoryId,
			hasVariants: parsedInput.hasVariants,
		} as const;
	});

// export const testAction = actionClient.schema(basicInfoSchema).action(async ({parsedInput, ctx})=>{
//   console.log("parsedInput", parsedInput);
//   return parsedInput
// })
