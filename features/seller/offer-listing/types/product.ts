export interface Product {
	id: string; // sellerOffer.id (UUID)
	name: string;
	image: string | null;
	sku: string | null;
	status: string; // “active” | “paused” | …
	stock: number; // aggregated available units
	price: string; // “45000.00”
	type: "offer"; // constant for now
	visibility: boolean; // sellerOffers.isVisible
	lastUpdated: Date; // sellerOffers.createdAt
}
