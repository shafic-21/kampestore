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
	placements: Partial<Record<"front" | "back", NormalizedPlacement>>;
	previews: Partial<Record<"front" | "back", Record<string, string>>>;
	views: Partial<
		Record<
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
		>
	>;
	colors: Record<
		string,
		{
			id: string;
			code: string;
			displayName: string;
			hexValue: string;
		}
	>;

	//mutable
	featuredColorId: string | null;
	selectedColorIds: string[] | null;
	creatorPrice: number;
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
				designBlobUrl: string;
				originalWidth: number;
				originalHeight: number;
				colorProfile: ColorProfile;
				templateScaleFactor: number;
				templatePPI: number;
			} | null
		>;
		previews: Record<string, string>;
		previewStates: Record<
			string,
			{
				designR2Key: string;
				placement: NormalizedPlacement;
				generatedAt: number;
			}
		>;
		currentProductColorId: string | null;
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

	setFeaturedColor: (colorId: string, baseId: string) => void;
	setSelectedColorIds: (colorIds: string[], baseId: string) => void;
	setCurrentProductColor: (colorId: string) => void;
	toggleColorSelection: (colorId: string, baseId: string) => void;

	setCreatorPrice: (price: number, baseId: string) => void;

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

export interface ListingState {
	listing: {
		id: string | null;
		title: string | null;
		description: string | null;
		designs: Record<
			string,
			{
				designR2Key: string;
			}
		> | null;
		products: string[];
	};
}

export interface ListingActions {
	createListing: () => void;
	updateListingDetails: (title: string, description?: string) => void;
	addProduct: (baseSkuId: string) => void;
	removeProduct: (baseSkuId: string) => void;
	clearListing: () => void;

	generateCatalogPreviews: () => Promise<void>;
	updateProductPlacement: (
		baseSkuId: string,
		viewCode: string,
		placement: NormalizedPlacement,
	) => void;
	generateSingleProductPreview: (baseSkuId: string) => Promise<void>;
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
		initialBase: string | null;
	};

	prefetchCatalogProducts: () => Promise<void>;
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
