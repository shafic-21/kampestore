import { v4 as uuidv4 } from "uuid";
import type {
	EditorSliceCreator,
	NormalizedPlacement,
} from "../types/store.types";
import { trpcClient } from "@/trpc/client";
import { deleteR2File, extractKeyFromPublicUrl } from "@/lib/r2";

export const createEditorSlice: EditorSliceCreator = (set, get) => ({
	editor: {
		sessionId: null,
		currentBaseSkuId: null,
		stageSize: { width: 600, height: 600 },
		currentDesigns: {},
		previews: {},
		previewStates: {},
		selectedColors: [],
		featuredColorId: null,
		currentProductColorId: null,
		customerPrice: null,
	},

	initializeEditor: (baseSkuId) => {
		const state = get();
		const base = state.bases.catalog[baseSkuId];
		if (!base) {
			console.warn(
				`[initializeEditor] Product ${baseSkuId} not found in catalog`,
			);
			return;
		}

		const sessionId = uuidv4();
		const defaultCustomerPrice = Math.round(base.cost * 1.2);
		const firstColorId = Object.keys(base.colors)[0];

		set((state) => ({
			editor: {
				...state.editor,
				sessionId,
				currentBaseSkuId: baseSkuId,
				customerPrice: defaultCustomerPrice,
			},
			meta: {
				...state.meta,
				// Set initialBase only if it's the first time (null)
				initialBase: state.meta.initialBase || baseSkuId,
			},
		}));

		if (firstColorId) {
			get().setSelectedColors([firstColorId]);
			get().setFeaturedColor(firstColorId);
			get().setCurrentProductColor(firstColorId);
		}

		console.log(
			`[initializeEditor] Initialized editor for ${base.name} (${baseSkuId})`,
		);
	},

	setStageSize: (size) => {
		set((state) => ({ editor: { ...state.editor, stageSize: size } }));
		get().calculatePrintQuality();
	},

	uploadDesign: async (viewCode, file) => {
		const currentBaseSkuId = get().editor.currentBaseSkuId;
		try {
			// Upload file to R2
			const formData = new FormData();
			formData.append("file", file);
			formData.append("bucket", "PUBLIC");
			formData.append("prefix", "DESIGNS");
			formData.append("userId", get().editor.sessionId || "anonymous");
			const uploadResponse = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			if (!uploadResponse.ok) {
				throw new Error("Failed to upload design to R2");
			}
			const uploadResult = await uploadResponse.json();
			if (!uploadResult.success) {
				throw new Error(uploadResult.error || "Upload failed");
			}
			console.log("UPLOAD", uploadResult);
			const designR2Key = uploadResult.data.key;
			// Extract colors and dimensions using server-side tRPC procedure
			const {
				colorProfile,
				width: originalWidth,
				height: originalHeight,
			} = await trpcClient.productDesign.mockup.extractColorsAndSize.mutate({
				designR2Key,
			});
			if (!currentBaseSkuId) {
				throw new Error("Base not found");
			}
			const product = get().bases.catalog[currentBaseSkuId];
			const currentView = product.views[viewCode as "front" | "back"];
			const printArea = currentView.printArea;
			const initialWidth = printArea.width_px * 0.5;
			const initialHeight = (initialWidth / originalWidth) * originalHeight;
			const currentDesign = {
				left: 0,
				top: 0,
				width: initialWidth,
				height: initialHeight,
				rotation: 0,
				relativeMidXOffset: 0,
				relativeMidYOffset: 0,
				designR2Key: designR2Key,
				originalWidth,
				originalHeight,
				colorProfile,
				templateScaleFactor: 1,
				templatePPI: 150,
			};
			set((state) => ({
				editor: {
					...state.editor,
					currentDesigns: {
						// Changed from currentDesign
						...state.editor.currentDesigns,
						[viewCode]: currentDesign, // Set design for specific view
					},
					// Clear previews only for this view
					previews: Object.fromEntries(
						Object.entries(state.editor.previews).filter(
							([key]) => !key.startsWith(`${viewCode}_`),
						),
					),
					previewStates: Object.fromEntries(
						Object.entries(state.editor.previewStates).filter(
							([key]) => !key.startsWith(`${viewCode}_`),
						),
					),
				},
			}));
		} catch (error) {
			console.error("Design upload failed:", error);
			throw new Error(
				error instanceof Error ? error.message : "Design upload failed",
			);
		}
	},

	updateDesignAttributes: (
		viewCode: string,
		attrs: Partial<NormalizedPlacement>,
	) => {
		set((state) => {
			const currentDesign = state.editor.currentDesigns[viewCode];
			if (!currentDesign) return state;

			return {
				editor: {
					...state.editor,
					currentDesigns: {
						...state.editor.currentDesigns,
						[viewCode]: {
							...currentDesign,
							...attrs,
						},
					},
				},
			};
		});
	},

	deleteDesign: (viewCode: string) => {
		const currentDesign = get().editor.currentDesigns[viewCode];
		if (!currentDesign) return;

		set((state) => ({
			editor: {
				...state.editor,
				currentDesigns: {
					...state.editor.currentDesigns,
					[viewCode]: null,
				},
				// Clear previews only for this view
				previews: Object.fromEntries(
					Object.entries(state.editor.previews).filter(
						([key]) => !key.startsWith(`${viewCode}_`),
					),
				),
				previewStates: Object.fromEntries(
					Object.entries(state.editor.previewStates).filter(
						([key]) => !key.startsWith(`${viewCode}_`),
					),
				),
			},
		}));

		if (currentDesign.designR2Key) {
			deleteR2File("PRIVATE", currentDesign.designR2Key);
		}
	},

	calculatePrintQuality: () => {},

	resetEditor: () => {
		// Clean up editor preview blob URLs
		Object.values(get().editor.previews).forEach((url) => {
			if (url.startsWith("blob:")) {
				URL.revokeObjectURL(url);
			}
		});

		set((state) => ({
			editor: {
				...state.editor,
				sessionId: null,
				currentBaseSkuId: null,
				currentDesign: null,
				previews: {},
				previewStates: {},
				selectedColors: [],
				featuredColorId: null,
				currentProductColorId: null,
				customerPrice: null,
			},
		}));
	},

	setSelectedColors: (colorIds) =>
		set((state) => ({
			editor: { ...state.editor, selectedColors: colorIds.slice(0, 5) },
		})),
	setFeaturedColor: (colorId) =>
		set((state) => ({ editor: { ...state.editor, featuredColorId: colorId } })),
	setCurrentProductColor: (colorId) =>
		set((state) => ({
			editor: { ...state.editor, currentProductColorId: colorId },
		})),

	toggleColorSelection: (colorId) => {
		set((state) => {
			const isSelected = state.editor.selectedColors.includes(colorId);
			let newSelectedColors: string[];
			let newFeaturedColorId = state.editor.featuredColorId;
			let newCurrentProductColorId = state.editor.currentProductColorId;

			if (isSelected) {
				newSelectedColors = state.editor.selectedColors.filter(
					(id) => id !== colorId,
				);
				if (state.editor.featuredColorId === colorId) {
					newFeaturedColorId = newSelectedColors[0] || null;
				}

				// Handle currentProductColorId when removing
				if (state.editor.currentProductColorId === colorId) {
					newCurrentProductColorId = newSelectedColors[0] || null;
				}
			} else if (state.editor.selectedColors.length < 5) {
				newSelectedColors = [...state.editor.selectedColors, colorId];
				if (!state.editor.featuredColorId) {
					newFeaturedColorId = colorId;
				}
			} else {
				return {};
			}

			return {
				editor: {
					...state.editor,
					selectedColors: newSelectedColors,
					featuredColorId: newFeaturedColorId,
					currentProductColorId: newCurrentProductColorId,
				},
			};
		});
	},

	setCustomerPrice: (price) => {
		set((state) => ({ editor: { ...state.editor, customerPrice: price } }));
	},

	getCurrentNormalizedPlacement: (viewCode: string) => {
		const currentDesign = get().editor.currentDesigns[viewCode];
		if (!currentDesign) return null;

		return {
			left: currentDesign.left,
			top: currentDesign.top,
			width: currentDesign.width,
			height: currentDesign.height,
			rotation: currentDesign.rotation,
			relativeMidXOffset: currentDesign.relativeMidXOffset,
			relativeMidYOffset: currentDesign.relativeMidYOffset,
		};
	},

	applyNormalizedPlacement: (
		viewCode: string,
		placement: NormalizedPlacement,
	) => {
		get().updateDesignAttributes(viewCode, placement);
	},

	getPublishingData: () => {
		const state = get();
		const currentDesigns = state.editor.currentDesigns;

		const publishingData: Record<
			string,
			{ designR2Key: string; placement: NormalizedPlacement }
		> = {};

		for (const [viewCode, design] of Object.entries(currentDesigns)) {
			if (!design) continue;

			const placement = state.getCurrentNormalizedPlacement(viewCode);
			if (!placement) continue;

			publishingData[viewCode] = {
				designR2Key: design.designR2Key,
				placement,
			};
		}

		return Object.keys(publishingData).length > 0 ? publishingData : null;
	},

	// ===== PREVIEW MANAGEMENT ACTIONS =====

	isCacheValid: (viewCode: string, colorId: string) => {
		const state = get();
		const cacheKey = `${viewCode}_${colorId}`;
		const cachedState = state.editor.previewStates[cacheKey];
		const currentDesign = state.editor.currentDesigns[viewCode];

		if (!cachedState || !currentDesign) return false;

		const currentPlacement = state.getCurrentNormalizedPlacement(viewCode);
		if (!currentPlacement) return false;

		return (
			cachedState.designR2Key === currentDesign.designR2Key &&
			cachedState.placement.left === currentPlacement.left &&
			cachedState.placement.top === currentPlacement.top &&
			cachedState.placement.width === currentPlacement.width &&
			cachedState.placement.height === currentPlacement.height &&
			cachedState.placement.rotation === currentPlacement.rotation &&
			cachedState.placement.relativeMidXOffset ===
				currentPlacement.relativeMidXOffset &&
			cachedState.placement.relativeMidYOffset ===
				currentPlacement.relativeMidYOffset
		);
	},

	generatePreview: async (
		viewCode: string,
		colorId: string,
		forceRegenerate = false,
	) => {
		const state = get();
		const currentDesign = state.editor.currentDesigns[viewCode];
		const currentBaseSkuId = state.editor.currentBaseSkuId;

		// Guard: No design uploaded for this view
		if (!currentDesign) {
			console.warn(
				`No design uploaded for ${viewCode} view - cannot generate preview`,
			);
			return;
		}

		// Guard: No base product selected
		if (!currentBaseSkuId) {
			console.warn("No base product selected - cannot generate preview");
			return;
		}

		const cacheKey = `${viewCode}_${colorId}`;
		const hasCache = Boolean(state.editor.previews[cacheKey]);
		const isValid = hasCache && state.isCacheValid(viewCode, colorId);

		// SHOW STALE IMMEDIATELY: If cache exists, we're done for immediate display
		if (hasCache && !forceRegenerate) {
			if (isValid) {
				console.log(`Using valid cached preview for ${cacheKey}`);
				return;
			} else {
				console.log(
					`Showing stale preview for ${cacheKey}, regenerating in background...`,
				);
			}
		}

		// BACKGROUND REGENERATION: Generate fresh preview
		try {
			const base = state.bases.catalog[currentBaseSkuId];
			if (!base) throw new Error("Base product not found in catalog");

			const view = base.views[viewCode as keyof typeof base.views];
			if (!view) throw new Error(`View ${viewCode} not found`);

			const color = base.colors[colorId];
			if (!color) throw new Error(`Color ${colorId} not found`);

			const currentPlacement = state.getCurrentNormalizedPlacement(viewCode);
			if (!currentPlacement) throw new Error("Current placement not available");

			console.log(
				`${hasCache ? "Regenerating stale" : "Generating new"} preview for ${cacheKey}`,
			);

			// Generate mockup using tRPC
			const result =
				await trpcClient.productDesign.mockup.generateMockup.mutate({
					designR2Key: currentDesign.designR2Key,
					templateR2Key: extractKeyFromPublicUrl(view.template.url),
					backgroundColor: color.hexValue,
					templateSize: {
						width: view.template.sourceWidthPx,
						height: view.template.sourceHeightPx,
					},
					printArea: view.printArea,
					placement: currentPlacement,
					outputFormat: "png",
					quality: 90,
				});

			// Convert base64 to blob URL
			const base64Data = result.mockupData;
			const binaryString = atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: result.contentType });
			const blobUrl = URL.createObjectURL(blob);

			// SEAMLESS SWAP: Replace old preview with new one
			set((state) => {
				const newPreviews = { ...state.editor.previews };
				const newPreviewStates = { ...state.editor.previewStates };

				// Clean up old blob URL if it exists
				const oldPreview = newPreviews[cacheKey];
				if (oldPreview && oldPreview.startsWith("blob:")) {
					URL.revokeObjectURL(oldPreview);
				}

				// Add new preview
				newPreviews[cacheKey] = blobUrl;
				newPreviewStates[cacheKey] = {
					designR2Key: currentDesign.designR2Key,
					placement: currentPlacement,
					generatedAt: Date.now(),
				};

				// LRU cache management
				const previewKeys = Object.keys(newPreviews);
				if (previewKeys.length > 10) {
					const oldestKey = previewKeys.sort((a, b) => {
						const aTime = newPreviewStates[a]?.generatedAt || 0;
						const bTime = newPreviewStates[b]?.generatedAt || 0;
						return aTime - bTime;
					})[0];

					if (oldestKey && oldestKey !== cacheKey) {
						if (newPreviews[oldestKey]?.startsWith("blob:")) {
							URL.revokeObjectURL(newPreviews[oldestKey]);
						}
						delete newPreviews[oldestKey];
						delete newPreviewStates[oldestKey];
					}
				}

				return {
					editor: {
						...state.editor,
						previews: newPreviews,
						previewStates: newPreviewStates,
					},
				};
			});

			console.log(
				`Preview ${hasCache ? "regenerated" : "generated"} and seamlessly swapped for ${cacheKey}`,
			);
		} catch (error) {
			console.error(
				`Failed to ${hasCache ? "regenerate" : "generate"} preview for ${cacheKey}:`,
				error,
			);
			throw error;
		}
	},

	hasPreview: (viewCode: string, colorId: string) => {
		const cacheKey = `${viewCode}_${colorId}`;
		return Boolean(get().editor.previews[cacheKey]);
	},

	getPreview: (viewCode: string, colorId: string) => {
		const cacheKey = `${viewCode}_${colorId}`;
		return get().editor.previews[cacheKey] || null;
	},

	clearAllPreviews: () => {
		const state = get();

		// Clean up blob URLs
		Object.values(state.editor.previews).forEach((url) => {
			if (url.startsWith("blob:")) {
				URL.revokeObjectURL(url);
			}
		});

		set((state) => ({
			editor: {
				...state.editor,
				previews: {},
				previewStates: {},
			},
		}));
	},

	clearPreviewsForColor: (colorId: string) => {
		const state = get();
		const newPreviews = { ...state.editor.previews };
		const newPreviewStates = { ...state.editor.previewStates };

		// Find and remove previews for this color
		Object.keys(newPreviews).forEach((key) => {
			if (key.endsWith(`_${colorId}`)) {
				if (newPreviews[key].startsWith("blob:")) {
					URL.revokeObjectURL(newPreviews[key]);
				}
				delete newPreviews[key];
				delete newPreviewStates[key];
			}
		});

		set((state) => ({
			editor: {
				...state.editor,
				previews: newPreviews,
				previewStates: newPreviewStates,
			},
		}));
	},
});
