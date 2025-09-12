import { v4 as uuidv4 } from 'uuid';
import { extractKeyFromPublicUrl } from "@/lib/r2";
import { trpcClient } from "@/trpc/client";
import type { ListingProduct, ListingSliceCreator } from "../types/store.types";

export const createListingSlice: ListingSliceCreator = (set, get) => ({
  listing: {
    id: null,
    designs: null,
    products: [],
  },

  createListing: () => {
    const newListingId = uuidv4();
    const state = get();
    const publishingData = state.getPublishingData();

    const currentBaseSkuId = state.editor.currentBaseSkuId;
    const selectedColors = state.editor.selectedColors;
    const featuredColorId = state.editor.featuredColorId;
    const customerPrice = state.editor.customerPrice;

    if (!currentBaseSkuId) {
      console.error("No current product to create listing from");
      return null;
    }
    const base = state.bases.catalog[currentBaseSkuId];

    const initialProduct: ListingProduct = {
      baseSkuId: currentBaseSkuId,
      price: customerPrice || Math.round((base?.cost || 0) * 1.2),
      colors: selectedColors.slice(0, 5),
      featuredColorId: featuredColorId,
    };

    set((state) => ({
      listing: {
        ...state.listing,
        id: newListingId,
        designs: publishingData,
        products: [...state.listing.products, initialProduct],
      },
    }));
  },

  addProduct: (baseSkuId, colors = []) => {
    const state = get();
    if (state.listing.products.some((p) => p.baseSkuId === baseSkuId)) return;
    if (state.listing.products.length >= 15) return;

    const base = state.bases.catalog[baseSkuId];

    const defaultPrice = Math.round(base.cost * 1.2);
    const newProduct: ListingProduct = {
      baseSkuId,
      price: defaultPrice,
      colors: colors.slice(0, 3),
      featuredColorId: colors[0] || null,
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
    Object.values(get().bases.catalog).forEach((cachedProduct) => {
      if (cachedProduct.generatedPreview?.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(cachedProduct.generatedPreview.imageUrl);
      }
    });
    set((state) => ({
      bases: {
        ...state.bases,
        catalog: Object.fromEntries(
          Object.entries(state.bases.catalog).map(([id, product]) => [
            id,
            { ...product, generatedPreview: null },
          ]),
        ),
      },
      listing: {
        ...state.listing,
        id: null,
        designs: null,
        products: [],
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

    // Process each product
    for (const [index, product] of catalogProducts.entries()) {
      try {
        const view = product.views.front;
        if (!view) continue;

        // Use first color as default for preview
        const firstColorId = Object.keys(product.colors)[0];
        if (!firstColorId) continue;

        const color = product.colors[firstColorId];

        console.log(
          `Generating preview ${index + 1}/${catalogProducts.length}: ${product.name}`,
        );

        // Generate mockup
        const result =
          await trpcClient.productDesign.mockup.generateMockup.mutate({
            designR2Key: frontDesign.designR2Key,
            templateR2Key: extractKeyFromPublicUrl(view.template.url),
            backgroundColor: color.hexValue,
            templateSize: {
              width: view.template.sourceWidthPx,
              height: view.template.sourceHeightPx,
            },
            printArea: view.printArea,
            placement: frontDesign.placement,
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
                generatedPreview: {
                  imageUrl: blobUrl,
                  placement: frontDesign.placement,
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
});
