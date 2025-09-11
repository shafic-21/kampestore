
import { CreateListingView } from "@/features/product-design/ui/views/create-listing-view";
import { Suspense } from "react";

/**
 * Listing Page Server Component
 *
 * Handles the listing page where users can:
 * - View all products in their current listing in the sidebar
 * - Browse and add more products to the listing from the main content area
 * - Navigate to individual product editors with listing context
 *
 * URL: /editor/listing?id=listingId
 */
export default function ListingPage() {
	return (
		<Suspense fallback={<div>Loading listing...</div>}>
			<CreateListingView />
		</Suspense>
	);
}
