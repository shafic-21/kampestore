import { db } from "@/lib/db";
import { catalogProducts } from "@/lib/db/schema";
import { actionClient } from "@/lib/safe-action";
import { generateVariantTitle } from "@/lib/utils/index";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { variantsStepSchema } from "../schemas/variants";

export const saveProductVariants = actionClient
	.schema(variantsStepSchema)
	.bindArgsSchemas<[productId: z.ZodString]>([z.string().uuid()])
	.action(async ({ parsedInput, bindArgsParsedInputs: [productId] }) => {
		const product = await db.query.catalogProducts.findFirst({
			where: eq(catalogProducts.id, productId),
			columns: { title: true },
		});

		if (!product) {
			throw new Error(`Product with ID ${productId} not found.`);
		}

		const variantRecords = parsedInput.variants.map((variant) => ({
			catalogProductId: productId,
			title: generateVariantTitle(product.title, variant.attributes),
			sku: variant.sku,
			gtin: variant.gtin,
			attributes: variant.attributes,
			weight: variant.weight,
			dimensions: variant.dimensions,
			specificationsOverride: variant.specificationsOverride,
			isDefault: variant.isDefault,
		}));

		// 3. Update catalogProducts.variantDefiningAttributes
		// 4. Bulk insert variants
		// 5. Return success
	});
