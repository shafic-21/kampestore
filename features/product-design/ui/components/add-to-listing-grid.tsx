"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddToListingCard } from "./add-to-listing-card";
import { useListingStore } from "@/features/creators/store/listing-store";
import { useShallow } from "zustand/react/shallow";
import { trpc } from "@/trpc/client";

/**
 * ProductSelectionGrid Component
 *
 * Main content area for the listing page displaying:
 * - Search/filter controls for products
 * - Grid of available products using AddToListingCard
 * - Responsive layout for different screen sizes
 * - Integration with listing store for adding products
 *
 * Uses nuqs for URL state management of filters and search.
 */
export function AddToListingGrid() {
	// Get listing information for context
	const { products: listingProducts, addProduct } = useListingStore(
		useShallow((state) => ({
			products: state.products,
			addProduct: state.addProduct,
		})),
	);

	const { data, isLoading, isError } =
		trpc.baseSkus.getListingProducts.useQuery({});

	// Transform product data to match AddToListingCard interface
	const transformedProducts = useMemo(() => {
		if (!data?.products) return [];

		return data.products.map((product) => ({
			id: product.id,
			name: product.name,
			cost: product.cost,
			colors: product.colors,
			totalColors: product.totalColors,
			frontMockupUrl: product.frontMockupUrl,
			frontPrintArea: product.frontPrintArea || {
				// Fallback print area if none exists in database
				x_px: 75,
				y_px: 80,
				width_px: 250,
				height_px: 200,
				sourceWidthPx: 400,
				sourceHeightPx: 400,
				dpi: 150,
			},
		}));
	}, [data?.products]);

	// Note: Categories are handled separately if needed for filters
	// For now, focusing on the product listing with correct print areas

	// Handle loading and error states
	if (isLoading) {
		return (
			<div className="h-full flex flex-col">
				<div className="border-b bg-background p-6">
					<h1 className="text-2xl font-semibold">Add Products to Listing</h1>
					<p className="text-muted-foreground mt-1">
						Loading available products...
					</p>
				</div>
				<div className="flex-1 flex items-center justify-center">
					<div className="text-muted-foreground">Loading products...</div>
				</div>
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="h-full flex flex-col">
				<div className="border-b bg-background p-6">
					<h1 className="text-2xl font-semibold">Add Products to Listing</h1>
					<p className="text-muted-foreground mt-1">Error loading products</p>
				</div>
				<div className="flex-1 flex items-center justify-center">
					<div className="text-muted-foreground">Failed to load products</div>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header with search and filters */}
			<div className="bg-background p-6 space-y-4">
				<div>
					<h1 className="text-2xl font-semibold">
						Great design. Add it to more products with a single click!
					</h1>
					<p className="text-muted-foreground mt-1">
						Select a maximum of 15 products to launch them collectively as a
						'Listing'.
					</p>
				</div>
			</div>

			{/* Product Grid */}
			<ScrollArea className="flex-1">
				<div className="p-6">
					{transformedProducts.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-muted-foreground">
								No products found matching your criteria
							</p>
						</div>
					) : (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{transformedProducts.map((baseSku) => (
								<AddToListingCard
									key={baseSku.id}
									baseSku={baseSku}
									className="w-full"
								/>
							))}
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
