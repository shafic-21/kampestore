import { create } from "zustand";
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { trpcClient } from "@/trpc/client";
import type { CachedProduct, ProductDesignStore } from "../types/store.types";
import { createEditorSlice } from "./editor.slice";
import { createListingSlice } from "./listing.slice";

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

          prefetchCatalogProducts: async () => {
            const [set, get] = args;
            const state = get();

            const cachedProductIds = Object.keys(state.bases.catalog);

            if (cachedProductIds.length >= 20 &&
              state.bases.lastUpdated &&
              Date.now() - state.bases.lastUpdated < 1800000) {
              console.log(`Catalog already has ${cachedProductIds.length} products and is fresh`);
              return;
            }

            try {
              console.log(`Prefetching catalog (excluding ${cachedProductIds.length} cached products)`);

              const targetCatalogSize = 30;
              const currentSize = cachedProductIds.length;
              const fetchLimit = Math.min(
                targetCatalogSize - currentSize,
                30
              );

              if (fetchLimit <= 0) {
                console.log("Catalog already at target size");
                return;
              }

              const result = await trpcClient.productDesign.getCatalogForCache.query({
                limit: fetchLimit,
                excludeIds: cachedProductIds,
              });
              if (result.products.length === 0) {
                console.log("No new products to add to catalog");
                return;
              }

              // Merge new products with existing catalog
              const updatedCatalog: Record<string, CachedProduct> = {
                ...state.bases.catalog
              };

              result.products.forEach(product => {
                updatedCatalog[product.id] = product;
              });

              set((state) => ({
                bases: {
                  ...state.bases,
                  catalog: updatedCatalog,
                  lastUpdated: Date.now(),
                }
              }));

              console.log(`Added ${result.products.length} new products to catalog (total: ${Object.keys(updatedCatalog).length})`);
            } catch (error) {
              console.error("Failed to prefetch catalog:", error);
            }
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
