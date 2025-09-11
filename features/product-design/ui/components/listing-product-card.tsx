"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { formatCurrency } from "@automattic/format-currency";
import {useProductDesignStore } from "../../store";
import type { ListingProduct } from "../../types/store.types";

interface ListingProductCardProps {
	product: ListingProduct;
	listingId: string | null;
}

export function ListingProductCard({
	product,
	listingId,
}: ListingProductCardProps) {
	const router = useRouter();

	// Store selectors
	const removeProduct = useProductDesignStore((state) => state.removeProduct);
	const cachedProduct = useProductDesignStore((state) => state.bases.catalog[product.baseSkuId]);

	// Get featured color data
	const featuredColor = useMemo(() => {
		if (!cachedProduct?.colors || !product.featuredColorId) return null;
		return cachedProduct.colors[product.featuredColorId];
	}, [cachedProduct?.colors, product.featuredColorId]);

	// Calculate profit information
	const profit = Math.max(0, product.price - product.baseCost);
	const profitPercentage =
		product.baseCost > 0 ? Math.round((profit / product.baseCost) * 100) : 0;

	/**
	 * Navigate to individual product editor with listing context
	 */
	const handleEdit = () => {
		if (listingId) {
			router.push(`/product-design/editor/${listingId}/${product.baseSkuId}`);
		}
	};

	/**
	 * Remove product from listing
	 */
	const handleDelete = () => {
		removeProduct(product.baseSkuId);
	};

	// Show loading state if cached product not available
	if (!cachedProduct) {
		return (
			<Card className="overflow-hidden">
				<CardContent className="p-3">
					<div className="flex gap-3 items-center">
						<div className="w-20 h-20 flex-shrink-0 bg-muted rounded-md animate-pulse" />
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-muted rounded animate-pulse" />
							<div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
						</div>
						<div className="flex flex-col gap-1">
							<div className="w-16 h-8 bg-muted rounded animate-pulse" />
							<div className="w-16 h-8 bg-muted rounded animate-pulse" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="overflow-hidden transition-all">
			<CardContent className="p-3">
				<div className="flex gap-3 items-center">
					{/* Section 1: Product Image Preview */}
					<div className="w-20 h-20 flex-shrink-0">
						<div className="w-full h-full relative overflow-hidden rounded-md">
							{/* Use generated preview if available, otherwise show mockup */}
							{product.generatedPreview?.imageUrl ? (
								<Image
									src={product.generatedPreview.imageUrl}
									alt={`${cachedProduct.name} with design`}
									fill
									className="object-cover"
									sizes="80px"
								/>
							) : (
								<>
									{/* Background Color Layer */}
									<div
										className="absolute inset-0"
										style={{
											backgroundColor: featuredColor?.hexValue || "#f3f4f6",
										}}
									/>

									{/* Placeholder mockup */}
									<div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
										Preview pending
									</div>
								</>
							)}
						</div>
					</div>

					{/* Section 2: Product Information */}
					<div className="flex-1 min-w-0 space-y-1">
						<div>
							<h3 className="font-medium text-sm leading-tight line-clamp-1 truncate">
								{cachedProduct.name}
							</h3>
							<div className="flex gap-1 mt-1">
								{product.colors.slice(0, 3).map((colorId) => {
									const color = cachedProduct.colors[colorId];
									if (!color) return null;
									return (
										<div
											key={colorId}
											className={cn(
												"w-4 h-4 rounded-full border",
												colorId === product.featuredColorId && "ring-2 ring-primary ring-offset-1"
											)}
											style={{ backgroundColor: color.hexValue }}
											title={color.displayName}
										/>
									);
								})}
								{product.colors.length > 3 && (
									<span className="text-xs text-muted-foreground">
										+{product.colors.length - 3}
									</span>
								)}
							</div>
						</div>

						<div className="space-y-0.5">
							<div className="flex justify-between items-center text-sm">
								<span className="text-muted-foreground">Price:</span>
								<span className="font-medium">
									{formatCurrency(product.price, "UGX")}
								</span>
							</div>
							<div className="flex justify-between items-center text-xs">
								<span className="text-muted-foreground">Profit:</span>
								<span
									className={cn(
										"font-medium",
										profit > 0 ? "text-green-600" : "text-muted-foreground",
									)}
								>
									{formatCurrency(profit, "UGX")} ({profitPercentage}%)
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
							className="h-8 px-3"
							title="Edit product"
						>
							<Edit2 className="h-3 w-3" />
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleDelete}
							className="h-8 px-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
							title="Remove from listing"
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
