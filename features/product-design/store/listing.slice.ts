import { v4 as uuidv4 } from "uuid";
import { extractKeyFromPublicUrl } from "@/lib/r2";
import { trpcClient } from "@/trpc/client";
import type {
  ListingProduct,
  ListingSliceCreator,
  NormalizedPlacement,
} from "../types/store.types";
import { getBestContrastingColor } from "../utils/color-utils";

export const createListingSlice: ListingSliceCreator = (set, get) => ({
  listing: {
    id: null,
    designs: null,
    products: [],
    title: null,
    description: null,
  },

  createListing: () => {
    const newListingId = uuidv4();
    const state = get();
    const currentBaseSkuId = state.editor.currentBaseSkuId;
    const selectedColors = state.editor.selectedColors;
    const featuredColorId = state.editor.featuredColorId;
    const customerPrice = state.editor.customerPrice;

    if (!currentBaseSkuId) {
      console.error("No current product to create listing from");
      return null;
    }

    const base = state.bases.catalog[currentBaseSkuId];
    const currentDesigns = state.editor.currentDesigns;

    // Extract designs (designR2Key only, no placement)
    const listingDesigns: Record<string, { designR2Key: string }> = {};
    for (const [viewCode, design] of Object.entries(currentDesigns)) {
      if (design?.designR2Key) {
        listingDesigns[viewCode] = { designR2Key: design.designR2Key };
      }
    }

    // Get current placements for the initial product
    const currentPlacements: Partial<
      Record<"front" | "back", NormalizedPlacement>
    > = {};
    for (const viewCode of ["front", "back"] as const) {
      const placement = state.getCurrentNormalizedPlacement(viewCode);
      if (placement) {
        currentPlacements[viewCode] = placement;
      }
    }

    const initialProduct: ListingProduct = {
      baseSkuId: currentBaseSkuId,
      price: customerPrice || Math.round((base?.cost || 0) * 1.2),
      colors: selectedColors.slice(0, 5),
      featuredColorId: featuredColorId,
    };

    // Check for reusable editor previews
    const existingCatalogPreviews = state.bases.catalog[currentBaseSkuId].previews || {};
    const reusablePreviews: Record<string, Record<string, string>> = {};

    // Check if editor previews can be reused for this product
    for (const viewCode of ["front", "back"] as const) {
      if (!currentPlacements[viewCode]) continue;

      reusablePreviews[viewCode] = existingCatalogPreviews[viewCode] || {};

      // Check each color in selectedColors for reusable previews
      for (const colorId of selectedColors) {
        const cacheKey = `${viewCode}_${colorId}`;
        const editorPreview = state.editor.previews[cacheKey];
        const editorPreviewState = state.editor.previewStates[cacheKey];

        if (editorPreview && editorPreviewState && currentPlacements[viewCode]) {
          // Check if the preview is valid (placement hasn't changed)
          const placementMatches = (
            editorPreviewState.placement.left === currentPlacements[viewCode]!.left &&
            editorPreviewState.placement.top === currentPlacements[viewCode]!.top &&
            editorPreviewState.placement.width === currentPlacements[viewCode]!.width &&
            editorPreviewState.placement.height === currentPlacements[viewCode]!.height &&
            editorPreviewState.placement.rotation === currentPlacements[viewCode]!.rotation &&
            editorPreviewState.placement.relativeMidXOffset === currentPlacements[viewCode]!.relativeMidXOffset &&
            editorPreviewState.placement.relativeMidYOffset === currentPlacements[viewCode]!.relativeMidYOffset
          );

          if (placementMatches) {
            // Reuse the preview
            reusablePreviews[viewCode][colorId] = editorPreview;
            console.log(`Reusing editor preview for ${viewCode}_${colorId}`);
          }
        }
      }
    }

    set((state) => ({
      listing: {
        ...state.listing,
        id: newListingId,
        designs: listingDesigns, // Only designR2Key, no placement
        products: [...state.listing.products, initialProduct],
      },
      bases: {
        ...state.bases,
        catalog: {
          ...state.bases.catalog,
          [currentBaseSkuId]: {
            ...state.bases.catalog[currentBaseSkuId],
            placements: currentPlacements, // Store placement in product
            previews: {
              ...existingCatalogPreviews,
              ...reusablePreviews,
            },
          },
        },
      },
    }));
  },

  updateListingDetails: (title, description) => {
    set((state) => ({
      listing: {
        ...state.listing,
        title,
        description: description || null,
      },
    }));
  },

  addProduct: (baseSkuId, colors = [], featuredColorId) => {
    const state = get();
    if (state.listing.products.some((p) => p.baseSkuId === baseSkuId)) return;
    if (state.listing.products.length >= 15) return;

    const base = state.bases.catalog[baseSkuId];

    const defaultPrice = Math.round(base.cost * 1.2);
    const newProduct: ListingProduct = {
      baseSkuId,
      price: defaultPrice,
      colors: colors.slice(0, 3),
      featuredColorId: featuredColorId || colors[0] || null,
    };
    set((state) => ({
      listing: {
        ...state.listing,
        products: [...state.listing.products, newProduct],
      },
    }));
  },

  updateProduct: (baseSkuId, updates) => {
    set((state) => ({
      listing: {
        ...state.listing,
        products: state.listing.products.map((p) =>
          p.baseSkuId === baseSkuId ? { ...p, ...updates } : p,
        ),
      },
    }));
  },

  removeProduct: (baseSkuId) => {
    set((state) => ({
      listing: {
        ...state.listing,
        products: state.listing.products.filter(
          (p) => p.baseSkuId !== baseSkuId,
        ),
      },
    }));
  },

  getProduct: (baseSkuId) => {
    return (
      get().listing.products.find((p) => p.baseSkuId === baseSkuId) || null
    );
  },

  hasProducts: () => get().listing.products.length > 0,
  getProductCount: () => get().listing.products.length,

  clearListing: () => {
    // Clean up all generated preview blob URLs
    Object.values(get().bases.catalog).forEach((cachedProduct) => {
      // Also clean up any blob URLs in the previews object
      if (cachedProduct.previews) {
        Object.values(cachedProduct.previews).forEach((viewPreviews) => {
          Object.values(viewPreviews).forEach((previewUrl) => {
            if (typeof previewUrl === 'string' && previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(previewUrl);
            }
          });
        });
      }
    });

    set((state) => ({
      bases: {
        ...state.bases,
        catalog: Object.fromEntries(
          Object.entries(state.bases.catalog).map(([id, product]) => [
            id,
            {
              ...product,
              previews: {} // Clear all previews
            },
          ]),
        ),
      },
      listing: {
        ...state.listing,
        id: null,
        designs: null,
        products: [],
        title: null,
        description: null,
      },
    }));
  },

  generateCatalogPreviews: async () => {
    const state = get();
    const { designs } = state.listing;

    if (!designs || !designs.front) {
      console.error("No front design available for preview generation");
      return;
    }

    //Will update this to use both side designs
    const frontDesign = designs.front;
    const catalogProducts = Object.values(state.bases.catalog);

    console.log(
      `Starting preview generation for ${catalogProducts.length} products in catalog...`,
    );

    // Get design color profile for smart color selection
    const currentBaseSkuId = state.editor.currentBaseSkuId;
    const frontCurrentDesign = currentBaseSkuId ? state.editor.currentDesigns.front : null;
    const designColorProfile = frontCurrentDesign?.colorProfile;

    // Process each product
    for (const [index, product] of catalogProducts.entries()) {
      try {
        const view = product.views.front;
        if (!view) continue;

        // Determine which color to use for preview
        let selectedColorId: string;
        let isInitialProduct = false;

        // Check if this is the initial product that was edited
        if (currentBaseSkuId === product.id) {
          isInitialProduct = true;
          // For initial product, use featured color from listing
          const listingProduct = state.listing.products.find(p => p.baseSkuId === product.id);
          selectedColorId = listingProduct?.featuredColorId || Object.keys(product.colors)[0];
        } else {
          // For other products, use smart color selection based on design
          if (designColorProfile && designColorProfile.colors.length > 0) {
            const productColorArray = Object.values(product.colors);
            const smartColorId = getBestContrastingColor(designColorProfile, productColorArray);
            selectedColorId = smartColorId || Object.keys(product.colors)[0];
          } else {
            // Fallback to first color if no design color profile
            selectedColorId = Object.keys(product.colors)[0];
          }
        }

        if (!selectedColorId) continue;
        const color = product.colors[selectedColorId];

        // Skip if preview already exists for this color
        if (product.previews?.front?.[selectedColorId]) {
          console.log(`Preview already exists for ${product.name} (${color.displayName}), skipping`);
          continue;
        }

        console.log(
          `Generating preview ${index + 1}/${catalogProducts.length}: ${product.name}`,
        );

        // Use this product's specific placement
        const placement = product.placements?.front;
        if (!placement) {
          console.warn(
            `No placement found for product ${product.name}, skipping`,
          );
          continue;
        }

        // Generate mockup using product-specific placement
        const result =
          await trpcClient.productDesign.mockup.generateMockup.mutate({
            designR2Key: frontDesign.designR2Key, // Shared design
            templateR2Key: extractKeyFromPublicUrl(view.template.url),
            backgroundColor: color.hexValue,
            templateSize: {
              width: view.template.sourceWidthPx,
              height: view.template.sourceHeightPx,
            },
            printArea: view.printArea,
            placement: placement, // Product-specific placement
            outputFormat: "png",
            quality: 85,
          });

        // Convert to blob URL
        const base64Data = result.mockupData;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.contentType });
        const blobUrl = URL.createObjectURL(blob);

        // Update cached product with preview
        set((state) => ({
          bases: {
            ...state.bases,
            catalog: {
              ...state.bases.catalog,
              [product.id]: {
                ...state.bases.catalog[product.id],
                previews: {
                  ...state.bases.catalog[product.id].previews,
                  front: {
                    ...state.bases.catalog[product.id].previews?.front,
                    [selectedColorId]: blobUrl,
                  },
                },
              },
            },
          },
        }));

        // Small delay between requests
        if (index < catalogProducts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`Failed to generate preview for ${product.name}:`, error);
        // Continue with next product
      }
    }

    console.log("Catalog preview generation completed");
  },

  updateProductPlacement: (baseSkuId, viewCode, placement) => {
    set((state) => ({
      bases: {
        ...state.bases,
        catalog: {
          ...state.bases.catalog,
          [baseSkuId]: {
            ...state.bases.catalog[baseSkuId],
            placements: {
              ...state.bases.catalog[baseSkuId].placements,
              [viewCode]: placement,
            },
          },
        },
      },
    }));
  },

  generateSingleProductPreview: async (baseSkuId) => {
    const state = get();
    const { designs } = state.listing;
    const product = state.bases.catalog[baseSkuId];

    if (!designs?.front || !product) {
      console.error("Missing design or product for preview generation");
      return;
    }

    try {
      const view = product.views.front;
      if (!view) return;

      // Use this product's specific placement
      const placement = product.placements?.front;
      if (!placement) {
        console.error(`No placement found for product ${baseSkuId}`);
        return;
      }

      // Use featuredColorId from listing product, or fallback to first color
      const listingProduct = state.listing.products.find(p => p.baseSkuId === baseSkuId);
      const selectedColorId = listingProduct?.featuredColorId || Object.keys(product.colors)[0];
      if (!selectedColorId) return;
      const color = product.colors[selectedColorId];

      console.log(`Generating preview for edited product: ${product.name}`);

      // Generate mockup using product's specific placement
      const result =
        await trpcClient.productDesign.mockup.generateMockup.mutate({
          designR2Key: designs.front.designR2Key, // Shared design
          templateR2Key: extractKeyFromPublicUrl(view.template.url),
          backgroundColor: color.hexValue,
          templateSize: {
            width: view.template.sourceWidthPx,
            height: view.template.sourceHeightPx,
          },
          printArea: view.printArea,
          placement: placement, // Product-specific placement
          outputFormat: "png",
          quality: 85,
        });

      // Convert to blob URL
      const base64Data = result.mockupData;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: result.contentType });
      const blobUrl = URL.createObjectURL(blob);

      // Update cached product with new preview
      set((state) => ({
        bases: {
          ...state.bases,
          catalog: {
            ...state.bases.catalog,
            [baseSkuId]: {
              ...state.bases.catalog[baseSkuId],
              previews: {
                ...state.bases.catalog[baseSkuId].previews,
                front: {
                  ...state.bases.catalog[baseSkuId].previews?.front,
                  [selectedColorId]: blobUrl,
                },
              },
            },
          },
        },
      }));

      console.log(`Preview generated for product: ${product.name}`);
    } catch (error) {
      console.error(
        `Failed to generate preview for product ${product.name}:`,
        error,
      );
    }
  },
});
