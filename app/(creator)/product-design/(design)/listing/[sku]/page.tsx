import { Suspense } from "react";
import { CreateListingView } from "@/features/product-design/ui/views/create-listing-view";

interface ListingPageProps {
	params: Promise<{
		sku: string;
	}>;
}

/**
 * Listing Page Server Component
 *
 * Handles the listing page where users can:
 * - View all products in their current listing in the sidebar
 * - Browse and add more products to the listing from the main content area
 * - Navigate to individual product editors with listing context
 *
 * URL: /product-design/listing/[initial-sku]
 * The SKU parameter represents the initial base SKU that started this session
 */
export default async function ListingPage({ params }: ListingPageProps) {
	const { sku } = await params;

	return (
		<Suspense fallback={<div>Loading listing...</div>}>
			<CreateListingView initialSkuId={sku} />
		</Suspense>
	);
}