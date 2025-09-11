
"use client";
import { useSearchParams } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ListingSidePanel } from "../components/listing-side-panel";
import { AddToListingGrid } from "../components/add-to-listing-grid";


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
