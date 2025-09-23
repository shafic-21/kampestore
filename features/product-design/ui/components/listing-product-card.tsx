"use client";

import { formatCurrency } from "@automattic/format-currency";
import { Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProductDesignStore } from "../../store";

interface ListingProductCardProps {
	productId: string;
	initialSkuId: string;
}

export function ListingProductCard({
	productId,
	initialSkuId,
}: ListingProductCardProps) {
	const router = useRouter();

	// Store selectors
	const removeProduct = useProductDesignStore((state) => state.removeProduct);
	const product = useProductDesignStore(
		(state) => state.bases.catalog[productId],
	);

	// Calculate profit information
	const profit = Math.max(0, product.creatorPrice - product.cost);

	/**
	 * Navigate to individual product editor with listing context
	 * URL: /product-design/editor/[edit-sku]/[initial-sku]
	 */
	const handleEdit = () => {
		router.push(`/product-design/editor/${product.id}/${initialSkuId}`);
	};

	/**
	 * Remove product from listing
	 */
	const handleDelete = () => {
		removeProduct(product.id);
	};
	return (
		<div className="flex gap-8 items-center border-b last:border-b-0 pb-4">
			{/* Section 1: Product Image Preview */}
			<div className="flex gap-4 justify-start flex-grow">
				<div className="w-20 h-20 flex-shrink-0">
					<div className="w-full h-full relative overflow-hidden rounded-md">
						<Image
							src={
								(product.featuredColorId &&
									product.previews?.front?.[product.featuredColorId]) ||
								Object.values(product.previews?.front || {})[0] ||
								(product.views.front?.template.url as string)
							}
							alt={`${product.name} with design`}
							fill
							className="object-cover"
							sizes="80px"
						/>
					</div>
				</div>

				{/* Section 2: Product Information */}
				<div className="flex-1 min-w-0 space-y-1">
					<h3 className="font-medium text-base line-clamp-2 truncate">
						{product.name}
					</h3>

					<div className="flex justify-between items-center text-sm mt-4">
						<span className="text-muted-foreground">Price:</span>
						<span className="font-medium">
							{formatCurrency(product.creatorPrice, "UGX")}
						</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">Profit:</span>
						<span
							className={cn(
								"font-medium",
								profit > 0 ? "text-green-600" : "text-muted-foreground",
							)}
						>
							{formatCurrency(profit, "UGX")}
						</span>
					</div>
				</div>
			</div>

			{/* Section 3: Action Buttons */}
			<div className="flex flex-col gap-1 flex-shrink-0">
				<Button
					size="sm"
					variant="outline"
					onClick={handleEdit}
					title="Edit product"
				>
					Edit
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={handleDelete}
					className="hover:bg-destructive/10"
					title="Remove from listing"
				>
					<Trash2 className="size-3" />
				</Button>
			</div>
		</div>
	);
}
