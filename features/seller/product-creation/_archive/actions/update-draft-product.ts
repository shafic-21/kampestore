
"use server";

import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { catalogProducts } from "@/lib/db/schema";
import { detailsInfoSchema } from "../schemas/details-info";


import { TEST_SELLER_ID } from "@/features/seller/constants";
import { z } from "zod";
import { eq } from "drizzle-orm";

export type UpdateDraftProductResponse = {
  status: "success" | "error";
  productId?: string;
  serverError?: string;
};

export const updateDraftProduct = actionClient
  .schema(detailsInfoSchema)
  .bindArgsSchemas<[productId: z.ZodString]>([z.string().uuid()])
  .action(
    async ({
      parsedInput,
      bindArgsParsedInputs:[productId],
      ctx,
    }): Promise<UpdateDraftProductResponse> => {
      // const sellerId = ctx.session.sellerId;
      const sellerId = TEST_SELLER_ID;
      console.log("parsedInput", parsedInput);

      // 2. insert draft
      const [{ id }] = await db
        .update(catalogProducts)
        .set({
          detailedDescription: JSON.parse(parsedInput.description || "{}"),
          tags: parsedInput.tags,
          specifications: JSON.parse(parsedInput.specifications || "{}"),
          countryOfOrigin: parsedInput.countryOfOrigin,
        })
        .where(eq(catalogProducts.id, productId))
        .returning({ id: catalogProducts.id });
      return {
        status: "success",
        productId: id,
      } as const;
    }
  );
