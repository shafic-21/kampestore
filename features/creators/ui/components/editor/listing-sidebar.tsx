"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useListingStore } from "@/features/creators/store/listing-store";
import { useShallow } from "zustand/react/shallow";
import { ListingProductCard } from "./listing-product-card";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ListingSidePanelProps {
	variant?: "sidebar" | "floating" | "inset";
	side?: "left" | "right";
}

/**
 * ListingSidePanel Component
 *
 * Displays the sidebar for listing management containing:
 * - List of all products in the current listing
 * - Master product shown first with special styling
 * - Individual product cards with pricing and preview
 * - Navigation back to styles page
 *
 * Uses listing store for state management and product operations.
 */
export function ListingSidePanel({
	variant = "sidebar",
	side = "left",
	...props
}: ListingSidePanelProps) {
	const router = useRouter();

	// Get listing data from store
	const { products, listingId } = useListingStore(
		useShallow((state) => ({
			products: state.products,
			listingId: state.listingId,
		})),
	);

	/**
	 * Navigate back to styles page with listing context
	 */
	const handleBackToStyles = () => {
		if (listingId) {
			router.push(`/styles?listingId=${listingId}`);
		} else {
			router.push("/styles");
		}
	};

	return (
		<Sidebar
			collapsible="none"
			variant={variant}
			side={side}
			{...props}
			className="h-screen px-4 w-[560px]"
		>
			<SidebarHeader className="border-b p-4">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleBackToStyles}
						className="shrink-0"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="min-w-0 flex-1">
						<h2 className="text-lg font-semibold truncate">Your Listing</h2>
						<p className="text-sm text-muted-foreground">
							{products.length} {products.length === 1 ? "product" : "products"}
						</p>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<ScrollArea className="h-full">
					<div className="p-4 space-y-3">
						{products.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-muted-foreground">No products in listing</p>
							</div>
						) : (
							<>
								{/* All products rendered equally */}
								{products.map((product) => (
									<ListingProductCard
										key={product.baseSkuId}
										product={product}
										listingId={listingId}
									/>
								))}
							</>
						)}
					</div>
				</ScrollArea>
			</SidebarContent>

			<SidebarFooter className="border-t p-4">
				<div className="space-y-2 text-sm text-muted-foreground">
					<p>Max: 15 products per listing</p>
					<p>Current: {products.length}/15</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
