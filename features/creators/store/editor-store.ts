// /features/creators/store/editor-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EditorView, EditorData } from "../types/canvas.types";

/**
 * Design attributes for positioning and transforming designs on the canvas.
 * These attributes are used by Konva for rendering the design element.
 */
interface DesignAttributes {
  x: number; // X position on canvas
  y: number; // Y position on canvas
  width: number; // Design width in pixels
  height: number; // Design height in pixels
  rotation: number; // Rotation angle in degrees
  scaleX: number; // Horizontal scale factor (should always be 1 after transform)
  scaleY: number; // Vertical scale factor (should always be 1 after transform)
}

/**
 * ViewDesign WITHOUT the HTMLImageElement.
 * We store the image separately to avoid immer issues with DOM objects.
 */
interface ViewDesignState {
  imageId: string | null; // ID to reference the image in imageStore
  attrs: DesignAttributes; // Position/transform attributes
  isSelected: boolean; // Whether design is currently selected
  printQuality: "Good" | "Fair" | "Poor"; // DPI-based quality assessment
  originalDimensions?: {
    // Original image dimensions for DPI calc
    width: number;
    height: number;
  };
}

/**
 * Stage (canvas) dimensions - responsive to container size.
 */
interface StageSize {
  width: number;
  height: number;
}

/**
 * Main editor store state interface.
 * Images are stored separately from the immer state to avoid TypeScript issues.
 *
 * IMPORTANT: All computed getters have been removed to prevent Zustand v5 infinite loops.
 * Components should use granular selectors + useMemo for derived values.
 */
interface EditorStore {
  // ===== CORE DATA =====
  editorData: EditorData | null;
  currentViewId: string;
  designsByView: Record<string, ViewDesignState>;
  stageSize: StageSize;

  // ===== COLOR MANAGEMENT =====
  // Colors selected by user in the sidebar (up to 5 colors)
  selectedColors: string[];
  // Featured color ID - used for storefront display
  featuredColorId: string | null;
  // Current product color being displayed in the canvas
  currentProductColorId: string | null;

  // ===== PRICING MANAGEMENT =====
  // Customer's set selling price in UGX (client-side uses number)
  customerPrice: number;

  // ===== IMAGE STORE (Outside of immer) =====
  // Store actual HTMLImageElement objects separately
  imageStore: Map<string, HTMLImageElement>;

  // ===== ACTIONS ONLY (No computed getters - they cause infinite loops in v5) =====
  initializeEditor: (data: EditorData) => void;
  setCurrentView: (viewId: string) => void;
  setStageSize: (size: StageSize) => void;
  uploadDesign: (imageElement: HTMLImageElement, fileData?: File) => void;
  updateDesignAttributes: (attrs: Partial<DesignAttributes>) => void;
  setDesignSelection: (isSelected: boolean) => void;
  deleteCurrentDesign: () => void;
  calculatePrintQuality: () => void;
  resetEditor: () => void;
  
  // ===== COLOR MANAGEMENT ACTIONS =====
  setSelectedColors: (colorIds: string[]) => void;
  setFeaturedColor: (colorId: string) => void;
  setCurrentProductColor: (colorId: string) => void;
  toggleColorSelection: (colorId: string) => void;

  // ===== PRICING MANAGEMENT ACTIONS =====
  setCustomerPrice: (price: number) => void;
}

/**
 * Create the default design state (without image).
 * EXPORTED so components can use it when computing currentDesign.
 */
export const createDefaultDesignState = (): ViewDesignState => ({
  imageId: null,
  attrs: {
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
  isSelected: false,
  printQuality: "Good",
});

/**
 * Generate unique ID for images.
 */
const generateImageId = () =>
  `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Helper function to get current view from raw state.
 * Used internally by actions that need current view data.
 */
const getCurrentViewFromState = (state: {
  editorData: EditorData | null;
  currentViewId: string;
}): EditorView | null => {
  if (!state.editorData || !state.currentViewId) return null;
  return (
    state.editorData.views.find((v) => v.id === state.currentViewId) || null
  );
};

/**
 * Calculate print area bounds for the new scaling approach.
 *
 * Stage size now matches mockup size exactly (scaled if needed).
 * Print area coordinates are scaled directly from source dimensions.
 */
const getPrintAreaBoundsFromState = (state: {
  editorData: EditorData | null;
  currentViewId: string;
  stageSize: StageSize;
}): { x: number; y: number; width: number; height: number } => {
  const currentView = getCurrentViewFromState(state);
  const printArea = currentView?.printArea;

  if (!printArea || !currentView) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // Calculate scale based on stage size vs source size
  const sourceSize = Math.min(
    currentView.sourceWidthPx,
    currentView.sourceHeightPx,
  );
  const scale = sourceSize > 0 ? state.stageSize.width / sourceSize : 1;

  return {
    x: printArea.x_px * scale,
    y: printArea.y_px * scale,
    width: printArea.width_px * scale,
    height: printArea.height_px * scale,
  };
};

/**
 * Main editor store using Zustand.
 * Images are stored in a Map outside of the immer state to avoid DOM object issues.
 *
 * ZUSTAND V5 COMPATIBILITY: All computed getters removed to prevent infinite loops.
 * Components must use granular selectors and compute derived values with useMemo.
 */
export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      // ===== INITIAL STATE =====
      editorData: null,
      currentViewId: "",
      designsByView: {},
      stageSize: { width: 600, height: 600 },
      
      // ===== COLOR MANAGEMENT STATE =====
      selectedColors: [],
      featuredColorId: null,
      currentProductColorId: null,

      // ===== PRICING MANAGEMENT STATE =====
      customerPrice: 45000, // Default customer price in UGX

      // ===== IMAGE STORE =====
      imageStore: new Map(),

      // ===== ACTIONS ONLY (No getters - they cause infinite loops) =====

      initializeEditor: (data) => {
        const frontView = data.views.find((v) => v.code === "front");
        const designs: Record<string, ViewDesignState> = {};
        data.views.forEach((v) => {
          designs[v.id] = createDefaultDesignState();
        });

        // Calculate default customer price as 120% of base cost
        const defaultCustomerPrice = data.baseSku.cost 
          ? Math.round(data.baseSku.cost * 1.2) 
          : 45000;

        set(() => ({
          editorData: data,
          currentViewId: frontView?.id || data.views[0]?.id || "",
          designsByView: designs,
          customerPrice: defaultCustomerPrice,
        }));
      },

      setCurrentView: (viewId) =>
        set((state) =>
          state.editorData?.views.some((v) => v.id === viewId)
            ? { currentViewId: viewId }
            : {},
        ),

      setStageSize: (size) => {
        set(() => ({ stageSize: size }));
        get().calculatePrintQuality();
      },

      uploadDesign: (imageElement, fileData) => {
        const state = get();
        const { currentViewId } = state;

        const printBounds = getPrintAreaBoundsFromState(state);
        const imageId = generateImageId();

        const originalWidth =
          imageElement.naturalWidth || imageElement.width || 200;
        const originalHeight =
          imageElement.naturalHeight || imageElement.height || 200;
        const aspect = originalWidth / originalHeight;
        const base = 200;
        const width = aspect >= 1 ? base : base * aspect;
        const height = aspect >= 1 ? base / aspect : base;

        const x = printBounds.x + (printBounds.width - width) / 2;
        const y = printBounds.y + (printBounds.height - height) / 2;

        const nextDesign: ViewDesignState = {
          imageId,
          attrs: { x, y, width, height, rotation: 0, scaleX: 1, scaleY: 1 },
          isSelected: true,
          printQuality: "Good",
          originalDimensions: { width: originalWidth, height: originalHeight },
        };

        set((s) => {
          const nextImageStore = new Map(s.imageStore);
          nextImageStore.set(imageId, imageElement);

          return {
            imageStore: nextImageStore,
            designsByView: { ...s.designsByView, [currentViewId]: nextDesign },
          };
        });

        get().calculatePrintQuality();
      },

      // 5) updateDesignAttributes: immutably patch nested attrs
      updateDesignAttributes: (attrs) => {
        set((s) => {
          const curr = s.designsByView[s.currentViewId];
          if (!curr) return {};
          const next = { ...curr, attrs: { ...curr.attrs, ...attrs } };
          return {
            designsByView: { ...s.designsByView, [s.currentViewId]: next },
          };
        });
        get().calculatePrintQuality();
      },

      // 6) setDesignSelection: immutable flip
      setDesignSelection: (isSelected) =>
        set((s) => {
          const curr = s.designsByView[s.currentViewId];
          if (!curr) return {};
          const next = { ...curr, isSelected };
          return {
            designsByView: { ...s.designsByView, [s.currentViewId]: next },
          };
        }),

      // 7) deleteCurrentDesign: new Map & new designsByView entry
      deleteCurrentDesign: () => {
        const { currentViewId, designsByView } = get();
        const curr = designsByView[currentViewId];

        set((s) => {
          const nextImageStore = new Map(s.imageStore);
          if (curr?.imageId) nextImageStore.delete(curr.imageId);

          return {
            imageStore: nextImageStore,
            designsByView: {
              ...s.designsByView,
              [currentViewId]: createDefaultDesignState(),
            },
          };
        });
      },

      // 8) calculatePrintQuality: write back a new designsByView ref
      calculatePrintQuality: () => {
        const state = get();
        const { currentViewId, designsByView, imageStore } = state;
        const currentView = getCurrentViewFromState(state);
        const printArea = currentView?.printArea;
        const designState = designsByView[currentViewId];
        if (!designState?.imageId || !printArea || !currentView) return;

        const image = imageStore.get(designState.imageId);
        if (!image) return;

        const realW = designState.attrs.width;
        const realH = designState.attrs.height;
        const physicalW = realW / printArea.dpi;
        const physicalH = realH / printArea.dpi;

        const origW =
          designState.originalDimensions?.width ||
          image.naturalWidth ||
          image.width ||
          100;
        const origH =
          designState.originalDimensions?.height ||
          image.naturalHeight ||
          image.height ||
          100;

        const avgDpi = (origW / physicalW + origH / physicalH) / 2;
        const quality = avgDpi >= 100 ? "Good" : avgDpi >= 50 ? "Fair" : "Poor";

        set((s) => ({
          designsByView: {
            ...s.designsByView,
            [currentViewId]: {
              ...s.designsByView[currentViewId],
              printQuality: quality,
            },
          },
        }));
      },

      // ===== COLOR MANAGEMENT ACTIONS =====

      /**
       * Set the array of selected colors (up to 5 colors).
       * Used by the sidebar to manage which colors are available for the product.
       */
      setSelectedColors: (colorIds: string[]) => {
        set(() => ({
          selectedColors: colorIds.slice(0, 5), // Ensure max 5 colors
        }));
      },

      /**
       * Set the featured color that will be displayed in the storefront.
       * Must be one of the selected colors.
       */
      setFeaturedColor: (colorId: string) => {
        set(() => ({
          featuredColorId: colorId,
        }));
      },

      /**
       * Set the current product color being displayed in the canvas.
       * This affects the background color of the product mockup.
       */
      setCurrentProductColor: (colorId: string) => {
        set(() => ({
          currentProductColorId: colorId,
        }));
      },

      /**
       * Toggle a color in the selected colors array.
       * Adds if not present (up to 5 colors), removes if present.
       * If removing the featured color, resets featured to the first remaining color.
       */
      toggleColorSelection: (colorId: string) => {
        set((state) => {
          const isSelected = state.selectedColors.includes(colorId);
          let newSelectedColors: string[];
          let newFeaturedColorId = state.featuredColorId;

          if (isSelected) {
            // Remove color
            newSelectedColors = state.selectedColors.filter(id => id !== colorId);
            
            // If we're removing the featured color, set featured to first remaining color
            if (state.featuredColorId === colorId && newSelectedColors.length > 0) {
              newFeaturedColorId = newSelectedColors[0];
            } else if (newSelectedColors.length === 0) {
              newFeaturedColorId = null;
            }
          } else {
            // Add color (up to 5 max)
            if (state.selectedColors.length < 5) {
              newSelectedColors = [...state.selectedColors, colorId];
              
              // If no featured color set, make this the featured color
              if (!state.featuredColorId) {
                newFeaturedColorId = colorId;
              }
            } else {
              // Already at max, don't add
              return {};
            }
          }

          return {
            selectedColors: newSelectedColors,
            featuredColorId: newFeaturedColorId,
          };
        });
      },

      // ===== PRICING MANAGEMENT ACTIONS =====

      /**
       * Set the customer's selling price.
       * Used by the sidebar pricing component to update the customer's set price.
       */
      setCustomerPrice: (price: number) => {
        set(() => ({
          customerPrice: price,
        }));
      },

      resetEditor: () => {
        set(() => ({
          editorData: null,
          currentViewId: "",
          designsByView: {},
          stageSize: { width: 600, height: 600 },
          selectedColors: [],
          featuredColorId: null,
          currentProductColorId: null,
          customerPrice: 45000, // Reset to fallback default price (will be recalculated on next initialization)
          imageStore: new Map(),
        }));
      },
    }),
    { name: "editor-store" },
  ),
);

/**
 * IMPORTANT: Components should use this pattern for computed values:
 *
 * const { editorData, currentViewId, designsByView, stageSize, imageStore } =
 *   useEditorStore(useShallow((state) => ({
 *     editorData: state.editorData,
 *     currentViewId: state.currentViewId,
 *     designsByView: state.designsByView,
 *     stageSize: state.stageSize,
 *     imageStore: state.imageStore
 *   })));
 *
 * const currentView = useMemo(() => {
 *   if (!editorData || !currentViewId) return null;
 *   return editorData.views.find(v => v.id === currentViewId) || null;
 * }, [editorData, currentViewId]);
 *
 * const currentDesign = useMemo(() => {
 *   const designState = designsByView[currentViewId] || createDefaultDesignState();
 *   return {
 *     ...designState,
 *     image: designState.imageId ? imageStore.get(designState.imageId) || null : null
 *   };
 * }, [designsByView, currentViewId, imageStore]);
 */
