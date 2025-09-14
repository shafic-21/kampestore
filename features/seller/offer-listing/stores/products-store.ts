import { create } from "zustand";

interface ProductsState {
	filters: {
		category: string;
		search: string;
	};
	setFilters: (filters: ProductsState["filters"]) => void;
	selectedProducts: string[];
	setSelectedProducts: (productIds: string[]) => void;
	clearSelectedProducts: () => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
	filters: {
		category: "",
		search: "",
	},
	setFilters: (filters) => set({ filters }),

	selectedProducts: [],
	setSelectedProducts: (productIds) => set({ selectedProducts: productIds }),
	clearSelectedProducts: () => set({ selectedProducts: [] }),
}));
