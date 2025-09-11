"use server";

import {
	and,
	asc,
	desc,
	eq,
	ilike,
	inArray,
	gte,
	lte,
	sql,
	or,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	sellerOffers,
	catalogProducts,
	catalogProductVariants,
	inventoryLevels,
} from "@/lib/db/schema";
import { ProductOffersQueryInput } from "../schemas/product-offers";
import { mapSortField } from "../utils/sort-map";

export async function getSellerOffers(
	params: ProductOffersQueryInput,
	sellerId: string,
) {
	const {
		page,
		pageSize,
		sort,
		order,
		search,
		status,
		categoryId,
		stockMin,
		stockMax,
	} = params;

	const aggInventory = db
		.select({
			sellerOfferId: inventoryLevels.sellerOfferId,
			totalAvailable: sql<number>`
        COALESCE(SUM(${inventoryLevels.availableQuantity}), 0)::int
      `.as("totalAvailable"),
		})
		.from(inventoryLevels)
		.where(eq(inventoryLevels.sellerId, sellerId))
		.groupBy(inventoryLevels.sellerOfferId)
		.as("aggInventory");

	const conditions: Parameters<typeof and>[0][] = [
		eq(sellerOffers.sellerId, sellerId),
	];

	if (search) {
		const q = `%${search}%`;
		conditions.push(
			or(
				ilike(catalogProducts.title, q),
				ilike(catalogProductVariants.title, q),
				ilike(sellerOffers.sellerSku, q),
				ilike(catalogProductVariants.sku, q),
				ilike(catalogProducts.gtin, q),
			),
		);
	}

	if (status?.length) {
		conditions.push(inArray(sellerOffers.status, status));
	}

	if (categoryId) {
		conditions.push(eq(catalogProducts.leafCategoryId, categoryId));
	}

	if (stockMin !== undefined) {
		conditions.push(
			gte(sql`COALESCE(${aggInventory.totalAvailable}, 0)`, stockMin),
		);
	}

	if (stockMax !== undefined) {
		conditions.push(
			lte(sql`COALESCE(${aggInventory.totalAvailable}, 0)`, stockMax),
		);
	}

	const base = db
		.select({
			offerId: sellerOffers.id,
			sellerSku: sellerOffers.sellerSku,
			price: sellerOffers.price,
			currency: sellerOffers.currency,
			offerStatus: sellerOffers.status,
			createdAt: sellerOffers.createdAt,
			isVisible: sellerOffers.isVisible,
			productTitle: catalogProducts.title,
			variantTitle: catalogProductVariants.title,
			variantAttributes: catalogProductVariants.attributes,
			imageUrl: sql<string>`
        COALESCE(
          (${catalogProductVariants.variantImages} -> 0)::jsonb ->> 'url',
          (${catalogProducts.canonicalImages}     -> 0)::jsonb ->> 'url'
        )
      `.as("imageUrl"),

			stock: aggInventory.totalAvailable,
		})
		.from(sellerOffers)
		.innerJoin(
			catalogProductVariants,
			eq(sellerOffers.catalogVariantId, catalogProductVariants.id),
		)
		.innerJoin(
			catalogProducts,
			eq(catalogProductVariants.catalogProductId, catalogProducts.id),
		)
		.leftJoin(aggInventory, eq(sellerOffers.id, aggInventory.sellerOfferId));

	const filtered = base.where(and(...conditions));

	const totalQuery = db
		.select({ count: sql<number>`count(*)` })
		.from(filtered.as("sub"))
		.then((r) => r[0]?.count ?? 0);

	const orderColumn =
		sort === "stock"
			? sql`COALESCE(${aggInventory.totalAvailable}, 0)`
			: mapSortField(sort);

	const dataQuery = filtered
		.orderBy(order === "asc" ? asc(orderColumn) : desc(orderColumn))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	const [rawData, total] = await Promise.all([dataQuery, totalQuery]);

	const data = rawData.map((offer) => ({
		...offer,
		price: offer.price.toString(),
		stock: offer.stock,
	}));

	return { data, page, pageSize, total };
}
