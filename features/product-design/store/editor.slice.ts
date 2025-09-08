import { v4 as uuidv4 } from "uuid";
import type { EditorSliceCreator } from "../types/store.types";
import { trpcClient } from "@/trpc/client";
import { deleteR2File } from "@/lib/r2";

export const createEditorSlice: EditorSliceCreator = (set, get) => ({
  editor: {
    sessionId: null,
    currentBaseSkuId: null,
    stageSize: { width: 600, height: 600 },
    currentDesign: null,
    previews: {},
    selectedColors: [],
    featuredColorId: null,
    currentProductColorId: null,
    customerPrice: null,
  },

  initializeEditor: (baseSkuId) => {
    const base = get().bases.catalog[baseSkuId];
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

  uploadDesign: async (file) => {
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
      const currentView = Object.values(product.views)[0];
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
          currentDesign,
          //We reset the preview cache
          previews: {},
        },
      }));
    } catch (error) {
      console.error("Design upload failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "Design upload failed",
      );
    }
  },

  updateDesignAttributes: (attrs) => {
    set((state) => {
      if (!state.editor.currentDesign) return state;

      return {
        editor: {
          ...state.editor,
          currentDesign: {
            ...state.editor.currentDesign,
            ...attrs,
          },
        },
      };
    });
  },

  deleteDesign: () => {
    const currentDesign = get().editor.currentDesign;

    if (!currentDesign) return;

    set((state) => ({
      editor: {
        ...state.editor,
        currentDesign: null,
        previews: {},
      },
    }));

    if (currentDesign?.designR2Key) {
      deleteR2File("PUBLIC", currentDesign?.designR2Key);
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

      if (isSelected) {
        newSelectedColors = state.editor.selectedColors.filter(
          (id) => id !== colorId,
        );
        if (state.editor.featuredColorId === colorId) {
          newFeaturedColorId = newSelectedColors[0] || null;
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
        },
      };
    });
  },

  setCustomerPrice: (price) => {
    set((state) => ({ editor: { ...state.editor, customerPrice: price } }));
  },

  getCurrentNormalizedPlacement: () => {
    const currentDesign = get().editor.currentDesign;
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

  applyNormalizedPlacement: (placement) => {
    get().updateDesignAttributes(placement);
  },

  getPublishingData: () => {
    const state = get();
    const currentDesign = get().editor.currentDesign;
    if (!currentDesign) return null;

    const placement = state.getCurrentNormalizedPlacement();

    // Return imageUrl instead of file
    return currentDesign && placement
      ? {
          designR2Key: currentDesign.designR2Key, // Changed from file
          placement,
        }
      : null;
  },
});
