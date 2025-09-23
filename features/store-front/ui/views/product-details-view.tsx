"use client";

import { useEffect } from "react";
import { useQueryState } from "nuqs";
import { trpc } from "@/trpc/client";
import { ProductImageGallery } from "../components/product-image-gallery";
import { ProductInfo } from "../components/product-info";
import { ProductVariantSelector } from "../components/product-variant-selector";
import { AddToCartButton } from "../components/add-to-cart-button";
import { ProductAccordion } from "../components/product-accordion";
import { RelatedProducts } from "../components/related-products";
import { SelfContainedStoreHeader } from "../components/self-contained-store-header";

interface ProductDetailsViewProps {
  storeSlug: string;
  listingSlug: string;
  initialProductDetails: any; // Type will be inferred from tRPC
  initialProductId?: string;
  initialVariantId?: string;
}

export function ProductDetailsView({
  storeSlug,
  listingSlug,
  initialProductDetails,
  initialProductId,
  initialVariantId,
}: ProductDetailsViewProps) {
  // URL state management
  const [productId, setProductId] = useQueryState("p", {
    defaultValue: initialProductId || initialProductDetails.product.id,
  });
  const [variantId, setVariantId] = useQueryState("v", {
    defaultValue: initialVariantId || initialProductDetails.selectedVariant.id,
  });

  // Fetch product details with current URL params
  const { data: productDetails, isLoading } = trpc.storeFront.getProductDetails.useQuery(
    {
      storeSlug,
      listingSlug,
      productId: productId || undefined,
      variantId: variantId || undefined,
    },
    {
      initialData: initialProductDetails,
    }
  );

  // Update URL when variant changes
  const handleVariantChange = (newVariantId: string) => {
    setVariantId(newVariantId);
  };

  // Update product ID when switching products within the listing
  const handleProductChange = (newProductId: string) => {
    setProductId(newProductId);
    // Reset variant when changing products
    setVariantId(null);
  };

  // Fetch related products
  const { data: relatedProducts } = trpc.storeFront.getRelatedProducts.useQuery(
    {
      storeSlug,
      listingId: productDetails.listing.id,
      currentProductId: productDetails.product.id,
      limit: 4,
    },
    {
      enabled: !!productDetails && productDetails.allProducts.length > 1,
    }
  );

  // Fetch recommended products
  const { data: recommendedProducts } = trpc.storeFront.getRecommendedProducts.useQuery(
    {
      storeSlug,
      currentListingId: productDetails.listing.id,
      limit: 4,
    },
    {
      enabled: !!productDetails,
    }
  );

  // Handle add to cart
  const handleAddToCart = (productId: string, variantId: string, quantity: number) => {
    // TODO: Implement cart functionality
    console.log("Adding to cart:", { productId, variantId, quantity });
  };

  if (isLoading || !productDetails) {
    return (
      <div className="min-h-screen flex flex-col">
        <SelfContainedStoreHeader storeSlug={storeSlug} />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-200 rounded-lg"></div>
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-20 h-20 bg-gray-200 rounded-md"></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SelfContainedStoreHeader storeSlug={storeSlug} />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Images */}
        <div>
          <ProductImageGallery
            images={productDetails.images}
            productName={`${productDetails.listing.title} - ${productDetails.product.baseName}`}
          />
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-8">
          {/* Product Info */}
          <ProductInfo
            listingTitle={productDetails.listing.title}
            productName={productDetails.product.baseName}
            price={productDetails.selectedVariant.price}
          />

          {/* Product Selector for multiple products in listing */}
          {productDetails.allProducts.length > 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Product</h3>
              <div className="flex flex-wrap gap-2">
                {productDetails.allProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductChange(product.id)}
                    className={`px-4 py-2 text-sm border rounded-md transition-all ${
                      product.id === productDetails.product.id
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    {product.baseName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selector */}
          <ProductVariantSelector
            availableAttributes={productDetails.availableAttributes}
            variants={productDetails.variants}
            selectedVariant={productDetails.selectedVariant}
            onVariantChange={handleVariantChange}
          />

          {/* Add to Cart */}
          <AddToCartButton
            productId={productDetails.product.id}
            variantId={productDetails.selectedVariant.id}
            variantSku={productDetails.selectedVariant.sku}
            onAddToCart={handleAddToCart}
          />

          {/* Product Details Accordion */}
          <ProductAccordion
            listingDescription={null} // TODO: Add description field to listing
            productDetails={null} // TODO: Add product details when DB supports it
          />
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-16 space-y-16">
        {/* More with this design - show other products in same listing */}
        {relatedProducts && relatedProducts.length > 0 && (
          <RelatedProducts
            title="More with this design"
            products={relatedProducts}
            storeSlug={storeSlug}
          />
        )}

        {/* You might also like - show products from other listings */}
        {recommendedProducts && recommendedProducts.length > 0 && (
          <RelatedProducts
            title="You might also like"
            products={recommendedProducts}
            storeSlug={storeSlug}
          />
        )}
          </div>
        </div>
      </main>
    </div>
  );
}