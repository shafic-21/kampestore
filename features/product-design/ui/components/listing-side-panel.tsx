"use client";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

import { ListingProductCard } from "./listing-product-card";
import { useRouter } from "next/navigation";
import { ExitEditorButton } from "./exit-editor";
import { useProductDesignStore } from "../../store";

export function ListingSidePanel({...props}) {
	const router = useRouter();

	// Get listing data from store using individual selectors
	const listingId = useProductDesignStore((state) => state.listing.id);
	const products = useProductDesignStore((state) => state.listing.products);
	const hasProducts = useProductDesignStore((state) => state.hasProducts());
	const generatePreviews = useProductDesignStore((state) => state.generateBulkPreviewsForListing);

	/**
	 * Navigate to continue flow with listing
	 */
	const handleContinue = async () => {
		if (!listingId) return;

		// Generate previews before continuing
		await generatePreviews();

		// Navigate to next step (details page)
		router.push(`/product-design/details/${listingId}`);
	};

	/**
	 * Navigate back to styles/listing page
	 */
	const handleBackToStyles = () => {
		if (listingId) {
			router.push(`/product-design/listing/${listingId}`);
		} else {
			router.push("/product-design/listing");
		}
	};

	return (
		<Sidebar
			collapsible="none"
			className="px-4 h-full bg-transparent"
			style={{ width: "400px" }}
			{...props}
		>
			<SidebarContent className="bg-transparent">
				<ScrollArea className="h-full w-full overflow-hidden max-w-full">
					<div className="space-y-4 p-4">
						{/* Header */}
						<div className="space-y-2">
							<h3 className="font-semibold text-lg">
								Your Listing ({products.length}/15)
							</h3>
							<p className="text-sm text-muted-foreground">
								Products with your design applied
							</p>
						</div>

						{/* Products List */}
						{!hasProducts ? (
							<div className="text-center py-8">
								<p className="text-muted-foreground">No products in listing</p>
								<Button
									variant="outline"
									onClick={handleBackToStyles}
									className="mt-4"
								>
									Add Products
								</Button>
							</div>
						) : (
							<>
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

			{/* Footer Actions */}
			{hasProducts && (
				<SidebarFooter className="p-4 space-y-2">
					<Button
						onClick={handleContinue}
						className="w-full"
						disabled={!hasProducts}
					>
						Continue to Details
					</Button>
					<ExitEditorButton />
				</SidebarFooter>
			)}
		</Sidebar>
	);
}
