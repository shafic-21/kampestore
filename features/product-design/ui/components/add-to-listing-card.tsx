"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/features/creators/store/editor-store";
import { useListingStore } from "@/features/creators/store/listing-store";
import { useShallow } from "zustand/react/shallow";
import { ColorSwatchRow } from "@/components/ui/color-swatch";
import { formatCurrency } from "@automattic/format-currency";

interface Props {
	baseSku: {
		id: string;
		name: string;
		cost: number;
		frontMockupUrl: string;
		colors: Array<{
			id: string;
			hexColor: string;
			displayName: string;
		}>;
		totalColors: number;
		frontPrintArea: {
			x_px: number;
			y_px: number;
			width_px: number;
			height_px: number;
			sourceWidthPx: number;
			sourceHeightPx: number;
			dpi: number;
		};
	};
	className?: string;
}

export function AddToListingCard({ baseSku, className }: Props) {
	// ===== STORE DATA =====
	const normalizedPlacement = useEditorStore(
		useShallow((state) => state.getCurrentNormalizedPlacement()),
	);

	const { products, addProduct, removeProduct } = useListingStore(
		useShallow((state) => ({
			products: state.products,
			addProduct: state.addProduct,
			removeProduct: state.removeProduct,
		})),
	);

	// ===== COMPUTED VALUES =====
	const isSelected = products.some((p) => p.baseSkuId === baseSku.id);
	const isAtMaxLimit = products.length >= 15 && !isSelected;

	// Calculate print area position in the card container
	const printAreaContainerStyle = useMemo(() => {
		const { x_px, y_px, width_px, height_px, sourceWidthPx, sourceHeightPx } =
			baseSku.frontPrintArea;

		// How the source mockup fits in the square container (aspect-square with object-contain object-bottom)
		const mockupAspect = sourceWidthPx / sourceHeightPx;
		let mockupScale, mockupOffsetX, mockupOffsetY;

		if (mockupAspect > 1) {
			// Mockup wider than tall - fits to width, bottom aligned
			mockupScale = 1;
			mockupOffsetX = 0;
			mockupOffsetY = (1 - 1 / mockupAspect) * 100;
		} else {
			// Mockup taller than wide - fits to height, centered
			mockupScale = mockupAspect;
			mockupOffsetX = ((1 - mockupAspect) / 2) * 100;
			mockupOffsetY = 0;
		}

		// Convert print area coordinates to container percentages
		const printLeft =
			mockupOffsetX + (x_px / sourceWidthPx) * 100 * mockupScale;
		const printTop =
			mockupOffsetY + (y_px / sourceHeightPx) * 100 * mockupScale;
		const printWidth = (width_px / sourceWidthPx) * 100 * mockupScale;
		const printHeight = (height_px / sourceHeightPx) * 100 * mockupScale;

		return {
			position: "absolute" as const,
			left: `${printLeft}%`,
			top: `${printTop}%`,
			width: `${printWidth}%`,
			height: `${printHeight}%`,
			overflow: "hidden" as const, // Clip designs that exceed print area
		};
	}, [baseSku.frontPrintArea]);

	// Calculate design position and size within the print area container
	const designStyle = useMemo(() => {
		if (!normalizedPlacement) return null;

		// Simple: use the normalized percentages directly
		// The design should fill the same relative space in any print area
		return {
			position: "absolute" as const,
			left: `${normalizedPlacement.xPercent * 100}%`,
			top: `${normalizedPlacement.yPercent * 100}%`,
			width: `${normalizedPlacement.widthPercent * 100}%`,
			height: `${normalizedPlacement.heightPercent * 100}%`,
			transform: `rotate(${normalizedPlacement.rotation}deg)`,
			transformOrigin: "top left",
		};
	}, [normalizedPlacement]);

	// Get design file URL
	const [designUrl, setDesignUrl] = useState<string | null>(null);
	useEffect(() => {
		const publishing = useEditorStore.getState().getPublishingData();
		if (!publishing?.file) {
			setDesignUrl(null);
			return;
		}
		const url = URL.createObjectURL(publishing.file);
		setDesignUrl(url);
		return () => URL.revokeObjectURL(url);
	}, []);

	// ===== EVENT HANDLERS =====
	const handleCardClick = () => {
		if (isAtMaxLimit) return;
		if (isSelected) {
			removeProduct(baseSku.id);
		} else {
			addProduct(baseSku.id, baseSku.cost);
		}
	};

	const handleAddClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		handleCardClick();
	};

	return (
		<div className={className}>
			<Card
				className={cn(
					"p-0 border-none overflow-hidden cursor-pointer transition-all",
					"hover:shadow-lg",
					isAtMaxLimit && "opacity-50 cursor-not-allowed",
				)}
				onClick={handleCardClick}
			>
				<div className="aspect-square relative overflow-hidden">
					{/* Background Color Layer */}
					<div
						className="absolute inset-0"
						style={{ backgroundColor: "#000" }}
					/>

					{/* Print Area Container - This represents the printable area bounds */}
					<div style={printAreaContainerStyle}>
						{/* Design positioned within print area using normalized coordinates */}
						{designUrl && designStyle && (
							<img
								src={designUrl}
								alt="Design preview"
								className="absolute object-contain"
								style={designStyle}
							/>
						)}
					</div>

					{/* Product Mockup Overlay - Must come after design so it overlays on top */}
					<Image
						src={baseSku.frontMockupUrl}
						alt={`${baseSku.name} mockup`}
						fill
						className="object-contain object-bottom"
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
						placeholder="blur"
						blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7yl5L6R6LSUSb6JB7"
						priority={false}
					/>

					{/* Selection Indicator */}
					{isSelected && (
						<div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
							<Check className="size-4" />
						</div>
					)}

					{/* Add Button */}
					{!isSelected && (
						<Button
							size="icon"
							variant="outline"
							className="absolute top-2 right-2 rounded-full"
							onClick={handleAddClick}
							disabled={isAtMaxLimit}
						>
							<Plus className="size-4" />
						</Button>
					)}
				</div>
			</Card>

			{/* Product Information */}
			<div className="space-y-3 mt-4">
				<div className="space-y-1">
					<h3 className="font-medium text-lg leading-tight line-clamp-2">
						{baseSku.name}
					</h3>
				</div>

				<div className="space-y-2">
					<p className="text-sm flex justify-start gap-2">
						Base cost
						<span>{formatCurrency(baseSku.cost, "UGX")}</span>
					</p>
					<ColorSwatchRow
						colors={baseSku.colors}
						totalColors={baseSku.totalColors}
						swatchSize="xs"
						maxVisible={10}
					/>
				</div>
			</div>
		</div>
	);
}
