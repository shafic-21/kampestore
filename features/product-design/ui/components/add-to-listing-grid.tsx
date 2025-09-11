"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProductDesignStore } from "../../store";
import { BaseCard } from "../components/base-card";

export function AddToListingGrid() {
	const catalog = useProductDesignStore((state) => state.bases.catalog);
	const productCount = useProductDesignStore((state) => state.getProductCount());

const products = Object.values(catalog);

	return (
		<div className="h-full flex flex-col">
			<div className="bg-background p-6 space-y-4">
				<div>
					<h1 className="text-2xl font-semibold">
						Great design. Add it to more products with a single click!
					</h1>
					<p className="text-muted-foreground mt-1">
						Select a maximum of 15 products to launch them collectively as a
						'Listing'. ({productCount}/15 selected)
					</p>
				</div>
			</div>

			{/* Product Grid */}
			<ScrollArea className="flex-1">
				<div className="p-6">
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
						{products.map((product) => (
							<BaseCard
								key={product.id}
								base={{
									id: product.id,
									name: product.name,
									attributes: [],
									cost: product.cost.toString(),
									colors: Object.values(product.colors).map(color => ({
										id: color.id,
										hexValue: color.hexValue,
										displayName: color.displayName,
									})),
									totalColors: Object.keys(product.colors).length,
									displayImageUrl: product.generatedPreview?.imageUrl || "",
								}}
								isPreEditor={false}
								maxColorsVisible={5}
							/>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
