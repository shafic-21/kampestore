// /features/creators/ui/views/listing-view.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useListingStore } from "@/features/creators/store/listing-store";
import { ListingSidePanel } from "../components/editor/listing-sidebar";
import { AddToListingGrid } from "../components/editor/add-to-listing-grid";
import { useShallow } from "zustand/react/shallow";

/**
 * ListingView Component
 *
 * Main view for the listing page that provides:
 * - Listing sidebar displaying all products in the current listing
 * - Main content area with product selection grid
 * - Integration with listing store for state management
 *
 * URL: /editor/listing?id=listingId
 */
export function CreateListingView() {
	const searchParams = useSearchParams();
	const listingId = searchParams.get("id");

	// Get listing store state
	const { listingId: currentListingId, hasProducts } = useListingStore(
		useShallow((state) => ({
			listingId: state.listingId,
			hasProducts: state.hasProducts,
		})),
	);

	// Show loading state while initializing
	// if (!currentListingId || !hasProducts()) {
	//   return (
	//     <div className="flex items-center justify-center h-screen">
	//       <div className="text-muted-foreground">Loading listing...</div>
	//     </div>
	//   );
	// }

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 60)",
				} as React.CSSProperties
			}
		>
			<ListingSidePanel variant="inset" />
			<SidebarInset>
				<div className="h-full w-full max-w-7xl mx-auto">
					<AddToListingGrid />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
