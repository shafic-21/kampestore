import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { DesignElement, PrintQuality, EditorView } from "../types/editor.types";

interface EditorStore {
  // Selection state
  selectedColors: string[];
  currentViewId: string;
  designMode: "design" | "preview";
  
  // Design state
  designElements: DesignElement[];
  selectedElementId: string | null;
  
  // UI state
  isUploadingImage: boolean;
  
  // Actions
  setSelectedColors: (colors: string[]) => void;
  toggleColorSelection: (colorId: string) => void;
  setCurrentView: (viewId: string) => void;
  setDesignMode: (mode: "design" | "preview") => void;
  
  // Design element actions
  addDesignElement: (element: DesignElement) => void;
  updateDesignElement: (id: string, updates: Partial<DesignElement>) => void;
  removeDesignElement: (id: string) => void;
  setSelectedElement: (id: string | null) => void;
  
  // Upload state
  setUploadingImage: (uploading: boolean) => void;
  
  // Utility actions
  calculatePrintQuality: (element: DesignElement, printAreaDpi: number) => PrintQuality;
  resetEditor: () => void;
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    // Initial state
    selectedColors: [],
    currentViewId: "",
    designMode: "design",
    designElements: [],
    selectedElementId: null,
    isUploadingImage: false,

    // Color selection
    setSelectedColors: (colors: string[]) =>
      set((state) => {
        // Limit to 5 colors maximum
        state.selectedColors = colors.slice(0, 5);
      }),

    toggleColorSelection: (colorId: string) =>
      set((state) => {
        const index = state.selectedColors.indexOf(colorId);
        if (index >= 0) {
          state.selectedColors.splice(index, 1);
        } else if (state.selectedColors.length < 5) {
          state.selectedColors.push(colorId);
        }
      }),

    // View selection
    setCurrentView: (viewId: string) =>
      set((state) => {
        state.currentViewId = viewId;
        // Clear selected element when changing views
        state.selectedElementId = null;
      }),

    setDesignMode: (mode: "design" | "preview") =>
      set((state) => {
        state.designMode = mode;
        if (mode === "preview") {
          // Clear selection in preview mode
          state.selectedElementId = null;
        }
      }),

    // Design element management
    addDesignElement: (element: DesignElement) =>
      set((state) => {
        state.designElements.push(element);
        state.selectedElementId = element.id;
      }),

    updateDesignElement: (id: string, updates: Partial<DesignElement>) =>
      set((state) => {
        const element = state.designElements.find((el) => el.id === id);
        if (element) {
          Object.assign(element, updates);
        }
      }),

    removeDesignElement: (id: string) =>
      set((state) => {
        state.designElements = state.designElements.filter((el) => el.id !== id);
        if (state.selectedElementId === id) {
          state.selectedElementId = null;
        }
      }),

    setSelectedElement: (id: string | null) =>
      set((state) => {
        state.selectedElementId = id;
      }),

    // Upload state
    setUploadingImage: (uploading: boolean) =>
      set((state) => {
        state.isUploadingImage = uploading;
      }),

    // Utility functions
    calculatePrintQuality: (element: DesignElement, printAreaDpi: number) => {
      // Calculate effective DPI based on scaling
      const scaleX = element.scaleX || 1;
      const scaleY = element.scaleY || 1;
      const avgScale = (scaleX + scaleY) / 2;
      
      // Assume original image is at 72 DPI (web standard)
      const effectiveDpi = (72 * avgScale * element.originalWidth) / element.width;
      
      // Quality thresholds
      if (effectiveDpi >= printAreaDpi * 0.8) return "great"; // 80% of target DPI
      if (effectiveDpi >= printAreaDpi * 0.6) return "good";  // 60% of target DPI
      return "poor"; // Below 60% of target DPI
    },

    resetEditor: () =>
      set((state) => {
        state.selectedColors = [];
        state.currentViewId = "";
        state.designMode = "design";
        state.designElements = [];
        state.selectedElementId = null;
        state.isUploadingImage = false;
      }),
  }))
);