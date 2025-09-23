import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { trpc, getQueryClient } from "@/trpc/server";
import { ProductDetailsView } from "@/features/store-front/ui/views/product-details-view";

interface PageProps {
  params: Promise<{
    slug: string;
    listingSlug: string;
  }>;
  searchParams: Promise<{
    p?: string; // productId
    v?: string; // variantId
  }>;
}

export default async function ProductDetailsPage({ params, searchParams }: PageProps) {
  const { slug: storeSlug, listingSlug } = await params;
  const { p: productId, v: variantId } = await searchParams;

  const queryClient = getQueryClient();

  try {
    // Prefetch product details
    const productDetails = await trpc.storeFront.getProductDetails({
      storeSlug,
      listingSlug,
      productId,
      variantId,
    });

    // Prefetch related products if there are other products in this listing
    if (productDetails.allProducts.length > 1) {
      await trpc.storeFront.getRelatedProducts.prefetch({
        storeSlug,
        listingId: productDetails.listing.id,
        currentProductId: productDetails.product.id,
        limit: 4,
      });
    }

    // Prefetch recommended products
    await trpc.storeFront.getRecommendedProducts.prefetch({
      storeSlug,
      currentListingId: productDetails.listing.id,
      limit: 4,
    });

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductDetailsView
          storeSlug={storeSlug}
          listingSlug={listingSlug}
          initialProductDetails={productDetails}
          initialProductId={productId}
          initialVariantId={variantId}
        />
      </HydrationBoundary>
    );
  } catch (error) {
    console.error("Failed to load product details:", error);
    notFound();
  }
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { slug: storeSlug, listingSlug } = await params;
  const { p: productId, v: variantId } = await searchParams;

  try {
    const productDetails = await trpc.storeFront.getProductDetails({
      storeSlug,
      listingSlug,
      productId,
      variantId,
    });

    const title = `${productDetails.listing.title} - ${productDetails.product.baseName} | ${productDetails.listing.storeName}`;
    const description = `Shop ${productDetails.listing.title} on ${productDetails.product.baseName} from ${productDetails.listing.storeName}. Available in multiple colors and sizes.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: productDetails.images.length > 0 ? [productDetails.images[0]] : [],
        type: "product",
      },
    };
  } catch (error) {
    return {
      title: "Product Not Found",
      description: "The product you're looking for could not be found.",
    };
  }
}