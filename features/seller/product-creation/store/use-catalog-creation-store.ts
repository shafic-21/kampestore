import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { JSONContent } from "@tiptap/react";
import type { MediaItem } from "@/types";

export type CreationType = "full-product" | "offer-only";
export type CreationMode = "create" | "edit";

export interface CreationStep {
	id: string;
	title: string;
	isComplete: boolean;
	isAccessible: boolean;
}

export interface SpecificationItem {
	attributeId: string;
	attributeCode: string;
	attributeName: string;
	value: string;
	unit: string | null;
}

// Only catalog product fields - NO seller offer fields
export interface CatalogDraft {
	title?: string;
	leafCategoryId?: string;
	brandId?: string;
	gtin?: string;
	countryOfOrigin?: string;
	hasVariants?: boolean;
	variantDefiningAttributes?: string[];
	highlights?: string[];
	specifications?: SpecificationItem[];
	detailedDescription?: JSONContent;
	canonicalImages?: MediaItem[];
	variants?: CatalogVariantDraft[];
}

export interface CatalogVariantDraft {
	id: string;
	title: string;
	sku?: string;
	attributes: Record<string, string>;
	variantImages?: MediaItem[];
	specificationsOverride?: Record<string, any>;
	weight?: number;
	dimensions?: Record<string, number>;
}

export interface CatalogCreationState {
	// Mode & Type
	mode: CreationMode;
	creationType: CreationType;
	catalogProductId?: string;

	// Navigation
	currentStep: string;
	steps: CreationStep[];

	// Data
	draft: CatalogDraft;
	draftId?: string; // For uploads

	// UI State
	isLoading: boolean;
	isSaving: boolean;
	errors: Record<string, string>;

	// Actions
	setMode: (mode: CreationMode, type: CreationType) => void;
	setCatalogProductId: (id?: string) => void;
	setCurrentStep: (step: string) => void;
	updateDraft: (updates: Partial<CatalogDraft>) => void;
	updateVariant: (
		variantId: string,
		updates: Partial<CatalogVariantDraft>,
	) => void;
	addVariant: (variant: CatalogVariantDraft) => void;
	removeVariant: (variantId: string) => void;
	setError: (field: string, error: string) => void;
	clearError: (field: string) => void;
	clearErrors: () => void;
	setLoading: (loading: boolean) => void;
	setSaving: (saving: boolean) => void;
	generateDraftId: () => void;
	reset: () => void;

	// Submission
	submitCatalogProduct: () => Promise<string>; // Returns created product ID
}

const initialSteps: CreationStep[] = [
	{
		id: "search",
		title: "Search or Create",
		isComplete: false,
		isAccessible: true,
	},
	{
		id: "details",
		title: "Product Details",
		isComplete: false,
		isAccessible: false,
	},
	{ id: "variants", title: "Variants", isComplete: false, isAccessible: false },
	{
		id: "content",
		title: "Content & Media",
		isComplete: false,
		isAccessible: false,
	},
	{
		id: "review",
		title: "Review & Submit",
		isComplete: false,
		isAccessible: false,
	},
];

export const useCatalogCreationStore = create<CatalogCreationState>()(
	devtools(
		immer((set, get) => ({
			// Initial state
			mode: "create",
			creationType: "full-product",
			currentStep: "search",
			steps: initialSteps,
			draft: {},
			isLoading: false,
			isSaving: false,
			errors: {},

			// Mode & Setup Actions
			setMode: (mode, type) =>
				set((state) => {
					state.mode = mode;
					state.creationType = type;
					if (type === "offer-only") {
						state.steps = state.steps.filter((s) => s.id !== "search");
						state.currentStep = "details";
					}
				}),

			setCatalogProductId: (id) =>
				set((state) => {
					state.catalogProductId = id;
				}),

			// Navigation Actions
			setCurrentStep: (step) =>
				set((state) => {
					state.currentStep = step;
				}),

			// Draft Management Actions
			updateDraft: (updates) =>
				set((state) => {
					Object.assign(state.draft, updates);
				}),

			// Variant Management Actions
			updateVariant: (variantId, updates) =>
				set((state) => {
					const variant = state.draft.variants?.find((v) => v.id === variantId);
					if (variant) {
						Object.assign(variant, updates);
					}
				}),

			addVariant: (variant) =>
				set((state) => {
					if (!state.draft.variants) {
						state.draft.variants = [];
					}
					state.draft.variants.push(variant);
				}),

			removeVariant: (variantId) =>
				set((state) => {
					if (state.draft.variants) {
						state.draft.variants = state.draft.variants.filter(
							(v) => v.id !== variantId,
						);
					}
				}),

			// Error Management Actions
			setError: (field, error) =>
				set((state) => {
					state.errors[field] = error;
				}),

			clearError: (field) =>
				set((state) => {
					delete state.errors[field];
				}),

			clearErrors: () =>
				set((state) => {
					state.errors = {};
				}),

			// Loading State Actions
			setLoading: (loading) =>
				set((state) => {
					state.isLoading = loading;
				}),

			setSaving: (saving) =>
				set((state) => {
					state.isSaving = saving;
				}),

			// Utility Actions
			generateDraftId: () =>
				set((state) => {
					if (!state.draftId) {
						state.draftId = `draft-${Date.now()}-${Math.random()
							.toString(36)
							.substr(2, 9)}`;
					}
				}),

			reset: () =>
				set(() => ({
					mode: "create",
					creationType: "full-product",
					catalogProductId: undefined,
					currentStep: "search",
					steps: initialSteps,
					draft: {},
					draftId: undefined,
					isLoading: false,
					isSaving: false,
					errors: {},
				})),

			// Submission Action
			submitCatalogProduct: async () => {
				const state = get();
				set((draft) => {
					draft.isSaving = true;
				});

				try {
					// TODO: Implement actual API call
					const response = await fetch("/api/catalog/products", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							...state.draft,
							creatorSellerId: "current-seller-id", // Get from auth
						}),
					});

					if (!response.ok) throw new Error("Failed to create product");

					const { productId } = await response.json();

					set((draft) => {
						draft.isSaving = false;
						draft.catalogProductId = productId;
					});

					return productId;
				} catch (error) {
					set((draft) => {
						draft.isSaving = false;
						draft.errors.submit =
							error instanceof Error ? error.message : "Submission failed";
					});
					throw error;
				}
			},
		})),
		{ name: "catalog-creation-store" },
	),
);
