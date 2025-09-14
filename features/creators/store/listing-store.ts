import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { NormalizedPlacement } from "../types";

/**
 * Individual product in a listing.
 * All products have the same structure for consistency.
 * The master product is always at array[0].
 */
interface ListingProduct {
	/** Base SKU ID for this product */
	baseSkuId: string;

	/** Base cost of this product variant in UGX (number for MVP) */
	baseCost: number;

	/** Selling price in UGX (inherited or individually set, number for MVP) */
	price: number;

	/** Selected color variants (starts with just featured color) */
	selectedColors: string[];

	/** Featured color for display */
	featuredColorId: string;

	/** Design placement on this product */
	placement: NormalizedPlacement;

	/** Whether this product's settings have been individually edited */
	isIndividuallyEdited: boolean;
}

/**
 * Listing Store Interface.
 * Manages multi-product listings independently from editor.
 */
interface ListingStore {
	// ===== CORE STATE =====
	/**
	 * ID of the current listing session.
	 * null = no active listing
	 */
	listingId: string | null;

	/**
	 * All products in the listing.
	 * Array[0] is ALWAYS the master product (original/template).
	 */
	products: ListingProduct[];

	/**
	 * Core placement inherited by all products initially.
	 * This is the normalized placement from the master product.
	 */
	corePlacement: NormalizedPlacement | null;

	/**
	 * Master product's profit percentage for inheritance.
	 * Calculated as: (price - baseCost) / baseCost
	 */
	masterProfitPercentage: number;

	/**
	 * Design file ID reference (from editor store).
	 * All products in listing use the same design.
	 */
	designFileId: string | null;

	// ===== ACTIONS =====
	/**
	 * Initialize a new listing when "Continue" is clicked.
	 * Creates the master product at array[0].
	 */
	createListing: (
		masterProduct: Omit<ListingProduct, "isIndividuallyEdited">,
		designFileId: string,
	) => string;

	/**
	 * Load an existing listing session.
	 * Used when returning to edit.
	 */
	loadListing: (
		listingId: string,
		products: ListingProduct[],
		designFileId: string,
	) => void;

	/**
	 * Add a product with inherited settings.
	 */
	addProduct: (baseSkuId: string, baseCost: number) => void;

	/**
	 * Update a product after individual editing.
	 */
	updateProduct: (
		baseSkuId: string,
		updates: Partial<Omit<ListingProduct, "baseSkuId" | "baseCost">>,
	) => void;

	/**
	 * Remove a product (cannot remove master).
	 */
	removeProduct: (baseSkuId: string) => void;

	/**
	 * Get a specific product's data.
	 */
	getProduct: (baseSkuId: string) => ListingProduct | null;

	/**
	 * Check if product is master (at index 0).
	 */
	isMasterProduct: (baseSkuId: string) => boolean;

	/**
	 * Calculate inherited price for new products.
	 */
	calculateInheritedPrice: (baseCost: number) => number;

	/**
	 * Update master profit percentage.
	 * Called when master product price changes.
	 */
	updateMasterProfitPercentage: (newPrice: number) => void;

	/**
	 * Check if listing has products.
	 */
	hasProducts: () => boolean;

	/**
	 * Get count of products.
	 */
	getProductCount: () => number;

	/**
	 * Clear the listing session.
	 */
	clearListing: () => void;
}

/**
 * Utility to compute profit percentage from bigint money values.
 * Safely handles zero base cost.
 */
function computeProfitPercentage(price: number, baseCost: number): number {
	if (!baseCost) return 0;
	return (price - baseCost) / baseCost;
}

/**
 * Multiply a bigint cost by a decimal percentage (e.g., 1.2) and round.
 * We compute in integer space to maintain precision.
 */
function applyPercentage(cost: number, factor: number): number {
	return Math.round(cost * factor);
}

/**
 * Create the listing store.
 * Manages multi-product listings independently from editor.
 */
export const useListingStore = create<ListingStore>()(
	devtools(
		(set, get) => ({
			// ===== INITIAL STATE =====
			listingId: null,
			products: [],
			corePlacement: null,
			masterProfitPercentage: 0.2, // Default 20% markup
			designFileId: null,

			// ===== ACTIONS =====

			createListing: (masterProduct, designFileId) => {
				const newListingId = `lst_${Date.now()}_${Math.random()
					.toString(36)
					.substr(2, 9)}`;

				const profitPercentage = computeProfitPercentage(
					masterProduct.price,
					masterProduct.baseCost,
				);

				const master: ListingProduct = {
					...masterProduct,
					isIndividuallyEdited: false,
				};

				set({
					listingId: newListingId,
					products: [master],
					corePlacement: masterProduct.placement,
					masterProfitPercentage: profitPercentage,
					designFileId,
				});

				return newListingId;
			},

			loadListing: (listingId, products, designFileId) => {
				if (!products.length) {
					throw new Error("Cannot load listing without products");
				}
				const master = products[0];
				const profitPercentage = computeProfitPercentage(
					master.price,
					master.baseCost,
				);

				set({
					listingId,
					products,
					corePlacement: master.placement,
					masterProfitPercentage: profitPercentage,
					designFileId,
				});
			},

			addProduct: (baseSkuId, baseCost) => {
				const state = get();
				const { products, masterProfitPercentage, corePlacement } = state;

				if (products.some((p) => p.baseSkuId === baseSkuId)) {
					console.warn("Product already in listing");
					return;
				}
				if (products.length >= 15) {
					console.warn("Maximum 15 products in listing");
					return;
				}
				if (!corePlacement) {
					throw new Error("No core placement available");
				}

				const masterFeaturedColor = products[0]?.featuredColorId || "";
				const inheritedPrice = applyPercentage(
					baseCost,
					1 + masterProfitPercentage,
				);

				const newProduct: ListingProduct = {
					baseSkuId,
					baseCost,
					price: inheritedPrice,
					selectedColors: [masterFeaturedColor],
					featuredColorId: masterFeaturedColor,
					placement: corePlacement,
					isIndividuallyEdited: false,
				};

				set({ products: [...products, newProduct] });
			},

			updateProduct: (baseSkuId, updates) => {
				set((state) => {
					const index = state.products.findIndex(
						(p) => p.baseSkuId === baseSkuId,
					);
					if (index === -1) return {};

					const current = state.products[index];
					const updated: ListingProduct = {
						...current,
						...updates,
						isIndividuallyEdited: true,
					};

					const updatedProducts = [...state.products];
					updatedProducts[index] = updated;

					let newProfitPercentage = state.masterProfitPercentage;
					if (index === 0 && updates.price !== undefined) {
						newProfitPercentage = computeProfitPercentage(
							updates.price,
							updated.baseCost,
						);
					}

					return {
						products: updatedProducts,
						masterProfitPercentage: newProfitPercentage,
					};
				});
			},

			removeProduct: (baseSkuId) => {
				set((state) => {
					if (state.products[0]?.baseSkuId === baseSkuId) {
						console.warn("Cannot remove master product");
						return {};
					}
					return {
						products: state.products.filter((p) => p.baseSkuId !== baseSkuId),
					};
				});
			},

			getProduct: (baseSkuId) => {
				return get().products.find((p) => p.baseSkuId === baseSkuId) || null;
			},

			isMasterProduct: (baseSkuId) => {
				return get().products[0]?.baseSkuId === baseSkuId;
			},

			calculateInheritedPrice: (baseCost) => {
				const { masterProfitPercentage } = get();
				return applyPercentage(baseCost, 1 + masterProfitPercentage);
			},

			updateMasterProfitPercentage: (newPrice) => {
				set((state) => {
					if (!state.products.length) return {};
					const master = state.products[0];
					const newPercentage = computeProfitPercentage(
						newPrice,
						master.baseCost,
					);
					return { masterProfitPercentage: newPercentage };
				});
			},

			hasProducts: () => get().products.length > 0,
			getProductCount: () => get().products.length,

			clearListing: () => {
				set({
					listingId: null,
					products: [],
					corePlacement: null,
					masterProfitPercentage: 0.2,
					designFileId: null,
				});
			},
		}),
		{ name: "listing-store" },
	),
);

export type { ListingProduct };
