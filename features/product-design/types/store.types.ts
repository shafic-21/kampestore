import type { StateCreator } from "zustand";

export interface NormalizedPlacement {
	left: number;
	top: number;
	width: number;
	height: number;
	rotation: number;
	relativeMidXOffset: number;
	relativeMidYOffset: number;
}

export interface ColorProfile {
	colors: string[];
	dominantColor: string;
	profile: "vibrant" | "muted" | "dark" | "light";
}

export interface CachedProduct {
	id: string;
	code: string;
	name: string;
	cost: number;
	generatedPreview: {
		imageUrl: string;
		placement: NormalizedPlacement;
	} | null;
	views: Record<
		"front" | "back",
		{
			id: string;
			code: string;
			displayName: string;
			printArea: {
				x_px: number;
				y_px: number;
				width_px: number;
				height_px: number;
				dpi: number;
			};
			template: {
				url: string;
				sourceWidthPx: number;
				sourceHeightPx: number;
			};
		}
	>;
	colors: Record<
		string,
		{
			id: string;
			code: string;
			displayName: string;
			hexValue: string;
			isDefault: boolean;
		}
	>;
}

// ===== EDITOR SLICE TYPES =====
export interface EditorState {
	editor: {
		sessionId: string | null;
		currentBaseSkuId: string | null;
		stageSize: { width: number; height: number };
		currentDesigns: Record<
			string,
			{
				left: number;
				top: number;
				width: number;
				height: number;
				rotation: number;
				relativeMidXOffset: number;
				relativeMidYOffset: number;
				designR2Key: string;
				originalWidth: number;
				originalHeight: number;
				colorProfile: ColorProfile;
				templateScaleFactor: number;
				templatePPI: number;
			} | null
		>;

		//[view]_[colorId]:  "blob:..."
		previews: Record<string, string>;
		previewStates: Record<
			string,
			{
				designR2Key: string;
				placement: NormalizedPlacement;
				generatedAt: number;
			}
		>;
		selectedColors: string[];
		featuredColorId: string | null;
		currentProductColorId: string | null;
		customerPrice: number | null;
	};
}

export interface EditorActions {
	initializeEditor: (baseSkuId: string) => void;
	setStageSize: (size: { width: number; height: number }) => void;
	uploadDesign: (viewCode: string, file: File) => Promise<void>;
	updateDesignAttributes: (
		viewCode: string,
		attrs: Partial<NormalizedPlacement>,
	) => void;
	deleteDesign: (viewCode: string) => void;
	calculatePrintQuality: () => void;
	resetEditor: () => void;

	setSelectedColors: (colorIds: string[]) => void;
	setFeaturedColor: (colorId: string) => void;
	setCurrentProductColor: (colorId: string) => void;
	toggleColorSelection: (colorId: string) => void;

	setCustomerPrice: (price: number) => void;

	getCurrentNormalizedPlacement: (
		viewCode: string,
	) => NormalizedPlacement | null;
	applyNormalizedPlacement: (
		viewCode: string,
		placement: NormalizedPlacement,
	) => void;
	getPublishingData: () => Record<
		string,
		{ designR2Key: string; placement: NormalizedPlacement }
	> | null;
	// Preview management actions
	generatePreview: (viewCode: string, colorId: string) => Promise<void>;
	clearAllPreviews: () => void;
	clearPreviewsForColor: (colorId: string) => void;
	isCacheValid: (viewCode: string, colorId: string) => boolean;
}

export type EditorSlice = EditorState & EditorActions;

// ===== LISTING SLICE TYPES =====
export interface ListingProduct {
	baseSkuId: string;
	baseCost: number;
	price: number;
	colors: string[];
	featuredColorId: string | null;
	generatedPreview: {
		imageUrl: string;
		placement: NormalizedPlacement;
	} | null;
}

export interface ListingState {
	listing: {
		id: string | null;
		designs: Record<string, {
			designR2Key: string;
			placement: NormalizedPlacement;
		}> | null;
		products: ListingProduct[];
	};
}

export interface ListingActions {
	createListing: () => string;

	addProduct: (baseSkuId: string, colors?: string[]) => void;
	updateProduct: (
		baseSkuId: string,
		updates: Partial<Omit<ListingProduct, "baseSkuId" | "baseCost">>,
	) => void;
	removeProduct: (baseSkuId: string) => void;
	getProduct: (baseSkuId: string) => ListingProduct | null;
	hasProducts: () => boolean;
	getProductCount: () => number;
	clearListing: () => void;

	generateBulkPreviewsForListing: () => Promise<void>;
}

export type ListingSlice = ListingState & ListingActions;

// ===== COMBINED STORE TYPE =====
export interface ProductDesignStore extends EditorSlice, ListingSlice {
	bases: {
		catalog: Record<string, CachedProduct>;
		categories: Record<
			string,
			{
				id: string;
				name: string;
				parentId?: string;
				level: number;
			}
		>;
		lastUpdated: number;
		version: string;
	};

	meta: {
		version: string;
		lastSaved: number;
		currentStep: "pick" | "editor" | "listing" | "details";
		sessionStarted: number;
		shouldCleanup: boolean;
	};

	updateProductCache: (products: CachedProduct[]) => void;
	setCurrentStep: (step: ProductDesignStore["meta"]["currentStep"]) => void;
	initializeSession: () => void;
	cleanupSession: () => void;
}

// ===== SLICE CREATORS TYPE =====
export type EditorSliceCreator = StateCreator<
	ProductDesignStore,
	[],
	[],
	EditorSlice
>;
export type ListingSliceCreator = StateCreator<
	ProductDesignStore,
	[],
	[],
	ListingSlice
>;
