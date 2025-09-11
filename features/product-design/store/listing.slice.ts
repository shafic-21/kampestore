import { v4 as uuidv4 } from "uuid";
import type { ListingSliceCreator, ListingProduct } from "../types/store.types";

export const createListingSlice: ListingSliceCreator = (set, get) => ({
	listing: {
		id: null,
		designR2Key: null,
		products: [],
	},

	createListing: () => {
		const newListingId = uuidv4();
		const designR2Key = get().editor.currentDesign?.designR2Key || null;
		set((state) => ({
			listing: {
				...state.listing,
				id: newListingId,
				designR2Key,
				products: [],
				previews: {},
			},
		}));

		return newListingId;
	},

	addProduct: (baseSkuId, colors = []) => {
		const state = get();
		if (state.listing.products.some((p) => p.baseSkuId === baseSkuId)) return;
		if (state.listing.products.length >= 15) return;

		const base = state.bases.catalog[baseSkuId];

		const defaultPrice = Math.round(base.cost * 1.2);
		const newProduct: ListingProduct = {
			baseSkuId,
			baseCost: base.cost,
			price: defaultPrice,
			colors: colors.slice(0, 3),
			featuredColorId: colors[0] || null,
			generatedPreview: base.generatedPreview,
		};
		set((state) => ({
			listing: {
				...state.listing,
				products: [...state.listing.products, newProduct],
			},
		}));
	},

	updateProduct: (baseSkuId, updates) => {
		set((state) => ({
			listing: {
				...state.listing,
				products: state.listing.products.map((p) =>
					p.baseSkuId === baseSkuId ? { ...p, ...updates } : p,
				),
			},
		}));
	},

	removeProduct: (baseSkuId) => {
		set((state) => ({
			listing: {
				...state.listing,
				products: state.listing.products.filter(
					(p) => p.baseSkuId !== baseSkuId,
				),
			},
		}));
	},

	getProduct: (baseSkuId) => {
		return (
			get().listing.products.find((p) => p.baseSkuId === baseSkuId) || null
		);
	},

	hasProducts: () => get().listing.products.length > 0,
	getProductCount: () => get().listing.products.length,

	clearListing: () => {
		// Clean up blob URLs from listing products
		get().listing.products.forEach((product) => {
			if (product.generatedPreview?.imageUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(product.generatedPreview.imageUrl);
			}
		});

		// Clean up blob URLs from cached products (design-specific previews)
		Object.values(get().bases.catalog).forEach((cachedProduct) => {
			if (cachedProduct.generatedPreview?.imageUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(cachedProduct.generatedPreview.imageUrl);
			}
		});

		// Reset cached products' generated previews
		set((state) => ({
			bases: {
				...state.bases,
				catalog: Object.fromEntries(
					Object.entries(state.bases.catalog).map(([id, product]) => [
						id,
						{ ...product, generatedPreview: null },
					]),
				),
			},
			listing: {
				...state.listing,
				id: null,
				designR2Key: null,
				products: [],
			},
		}));
	},

	generateBulkPreviewsForListing: async (designData) => {
		//TODO create this later
	},
});
