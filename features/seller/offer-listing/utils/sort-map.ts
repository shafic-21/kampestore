import { sellerOffers, catalogProducts } from "@/lib/db/schema";

export const sortFieldMap = {
	createdAt: sellerOffers.createdAt,
	productName: catalogProducts.title,
	price: sellerOffers.price,
} as const; // stock handled inline

export type SortKey = keyof typeof sortFieldMap;
export const mapSortField = (key: SortKey) => sortFieldMap[key];
