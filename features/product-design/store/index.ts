import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";
import { createEditorSlice } from "./editor.slice";
import { createListingSlice } from "./listing.slice";
import type { ProductDesignStore, CachedProduct } from "../types/store.types";

const STORAGE_VERSION = "1.0.0";
const STORAGE_NAME = "pdt_design_state";

export const useProductDesignStore = create<ProductDesignStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...args) => ({
          ...createEditorSlice(...args),
          ...createListingSlice(...args),

          bases: {
            catalog: {},
            categories: {},
            lastUpdated: 0,
            version: STORAGE_VERSION,
          },

          meta: {
            version: STORAGE_VERSION,
            lastSaved: Date.now(),
            currentStep: "pick",
            sessionStarted: Date.now(),
            shouldCleanup: false,
          },

          updateProductCache: (products) => {
            const [set] = args;
            const catalog: Record<string, CachedProduct> = {};
            products.forEach((product) => {
              catalog[product.id] = product;
            });

            set((state) => ({
              bases: {
                ...state.bases,
                catalog,
                lastUpdated: Date.now(),
              },
            }));
          },

          setCurrentStep: (step) => {
            const [set] = args;
            set((state) => ({
              meta: {
                ...state.meta,
                currentStep: step,
                lastSaved: Date.now(),
              },
            }));
          },

          initializeSession: () => {
            const [set] = args;
            set((state) => ({
              meta: {
                ...state.meta,

                sessionStarted: Date.now(),
                shouldCleanup: false,
              },
            }));
          },

          cleanupSession: () => {
            const [set, get] = args;

            // Each method handles its own cleanup
            get().resetEditor();
            get().clearListing();

            set((state) => ({
              meta: {
                ...state.meta,
                shouldCleanup: true,
                lastSaved: Date.now(),
              },
            }));
          },
        }),
        {
          name: STORAGE_NAME,
          storage: createJSONStorage(() => localStorage),
          version: 1,
          partialize: (state) => ({
            editor: state.editor,
            listing: state.listing,
            bases: state.bases,
            meta: state.meta,
          }),
          onRehydrateStorage: () => (state) => {
            if (state?.meta.shouldCleanup) {
              state.cleanupSession();
            }
          },
        },
      ),
    ),
    { name: "pdt_design_state" },
  ),
);

export * from "../types/store.types";
