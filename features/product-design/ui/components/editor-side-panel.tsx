"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePreviewGenerator } from "../../hooks/use-preview-generator";
import { useProductDesignStore } from "../../store";
import { ExitEditorButton } from "./exit-editor";
import { ProductPreviewColorselector } from "./product-color-preview";

export function EditorSidePanel({ ...props }) {
	const [editorMode] = useQueryState(
		"mode",
		parseAsStringLiteral(["design", "preview"]).withDefault("design"),
	);
	const [editorViewCode] = useQueryState(
		"view",
		parseAsStringLiteral(["front", "back"]).withDefault("front"),
	);

	const { currentBaseSkuId, previews, currentDesign } = useProductDesignStore(
		useShallow((state) => ({
			currentBaseSkuId: state.editor.currentBaseSkuId, // Note: state.editor.*
			previews: state.editor.previews,
			currentDesign: state.editor.currentDesigns[editorViewCode],
		})),
	);

	const frontMockupUrl = useProductDesignStore((state) => {
		const skuId = state.editor.currentBaseSkuId;
		if (!skuId) return null;

		const product = state.bases.catalog[skuId];
		if (!product) return null;
		const frontView = Object.values(product.views).find(
			(v) => v.code === "front",
		);
		if (!frontView) return null;

		return frontView.template.url || null;
	});

	// Get color management actions from store
	const toggleColorSelection = useProductDesignStore(
		(state) => state.toggleColorSelection,
	);

	const setCurrentProductColor = useProductDesignStore(
		(state) => state.setCurrentProductColor,
	);

	const base = useProductDesignStore((state) =>
		currentBaseSkuId ? state.bases.catalog[currentBaseSkuId] : null,
	);

	const creatorPrice = base?.creatorPrice;
	const selectedColors = base?.selectedColorIds;
	const featuredColorId = base?.featuredColorId;
	// Get pricing management action from store
	const setCreatorPrice = useProductDesignStore(
		(state) => state.setCreatorPrice,
	);

	const [priceInputValue, setPriceInputValue] = useState<string>(
		creatorPrice ? base.creatorPrice?.toString() : "0",
	);

	const baseCost = base ? base.cost : 0;

	const isBelowCost = useMemo(
		() => parseInt(priceInputValue) < baseCost,
		[priceInputValue, baseCost],
	);

	// Display profit uses typed value if available; otherwise falls back to store value
	const displayProfit = useMemo(() => {
		const price = priceInputValue
			? parseInt(priceInputValue)
			: (creatorPrice as number);
		return Math.max(0, price - baseCost);
	}, [priceInputValue, creatorPrice, baseCost]);

	const availableColors = useMemo(
		() => (base?.colors ? Object.values(base.colors) : []),
		[base?.colors],
	);

	// ===== EARLY RETURN FOR LOADING =====

	// ===== PREVIEW GENERATOR =====
	const { handleGeneratePreview, isGenerating, generationError } =
		usePreviewGenerator();

	// ===== EVENT HANDLERS =====
	/**
	 * Handle color selection toggle.
	 * Uses store action that manages the business logic for adding/removing colors
	 * and automatically updates the featured color when needed.
	 */
	const handleColorToggle = async (colorId: string) => {
		const wasSelected = selectedColors?.includes(colorId);

		if (!currentBaseSkuId) return;

		if (wasSelected) {
			toggleColorSelection(colorId, currentBaseSkuId);
		} else {
			// Adding color - handle preview mode carefully
			if (editorMode === "preview" && currentDesign) {
				const cacheKey = `${editorViewCode}_${colorId}`;
				const hasCache = Boolean(previews[cacheKey]);

				if (hasCache) {
					// Cache exists - safe to toggle and switch immediately
					toggleColorSelection(colorId, currentBaseSkuId);
					setCurrentProductColor(colorId);
				} else {
					toggleColorSelection(colorId, currentBaseSkuId);
					try {
						await handleGeneratePreview(editorViewCode, colorId);
						setCurrentProductColor(colorId);
					} catch (error) {
						console.error("Failed to generate preview:", error);
					}
				}
			} else {
				toggleColorSelection(colorId, currentBaseSkuId);
				setCurrentProductColor(colorId);
			}
		}
	};

	/**
	 * Handle price input changes.
	 * Updates both the input field (string) and the store (number) values.
	 */
	const handlePriceChange = (value: string) => {
		if (!currentBaseSkuId) return;
		const numericValue = value.replace(/[^0-9]/g, "");
		const priceNum = Number.parseFloat(numericValue) || 0;
		// Update input field immediately for better UX
		setPriceInputValue(numericValue);

		// Don't allow values below base cost (but allow empty for editing)
		if (priceNum >= baseCost || numericValue === "") {
			// Only update store if it's a valid price (not empty)
			if (numericValue !== "" && priceNum > 0) {
				setCreatorPrice(priceNum, currentBaseSkuId);
			}
		}
	};

	if (!base || !currentBaseSkuId || !selectedColors) {
		return (
			<Sidebar
				collapsible="none"
				{...props}
				className="px-4 h-full"
				style={{ width: "400px" }}
			>
				<SidebarContent>
					<div className="flex items-center justify-center h-64">
						<div className="text-muted-foreground">Loading sidebar...</div>
					</div>
				</SidebarContent>
			</Sidebar>
		);
	}

	return (
		<Sidebar
			collapsible="none"
			{...props}
			className="px-4 h-full bg-transparent"
			style={{ width: "400px" }}
		>
			<SidebarContent className="bg-transparent">
				<ScrollArea className="h-full w-full overflow-hidden max-w-full">
					<div className="space-y-4 p-4">
						<Card className="gap-4">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg">
									Choose product colors <span className="text-red-500">*</span>
								</CardTitle>
								<CardDescription>
									Select up to 5 backgrounds for your product
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{availableColors.map((color) => (
										<ColorSwatch
											key={color.id}
											color={color}
											size="md"
											isSelected={selectedColors?.includes(color.id)}
											isSelectable={true}
											isDisabled={
												(selectedColors.length >= 5 &&
													!selectedColors.includes(color.id)) ||
												(selectedColors.length === 1 &&
													selectedColors.includes(color.id))
											}
											onSelect={handleColorToggle}
										/>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Pricing */}
						<Card className="gap-4">
							<CardHeader className="">
								<CardTitle className="text-lg">
									Set your pricing <span className="text-red-500">*</span>
								</CardTitle>
								<CardDescription>
									Enter your desired retail price for your customers.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
											UGX
										</span>
										<Input
											id="price"
											type="text"
											value={priceInputValue}
											onChange={(e) => handlePriceChange(e.target.value)}
											className={cn(
												"pl-12 text-lg font-medium",
												isBelowCost &&
													"border-red-500 focus-visible:ring-red-500 text-red-600 placeholder:text-red-400",
											)}
											placeholder="45000"
											aria-invalid={isBelowCost}
											min={baseCost}
										/>
									</div>
									<div className="flex justify-between items-center pt-1">
										<span className="text-sm text-muted-foreground">
											Profit/Sale:
										</span>
										<span
											className={cn(
												"text-sm font-medium",
												isBelowCost ? "text-red-600" : "text-green-600",
											)}
										>
											UGX {displayProfit.toLocaleString()}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Featured Color Selection */}
						{selectedColors.length > 0 && (
							<Card className="gap-4">
								<CardHeader>
									<CardTitle className="text-lg">
										Select featured color
									</CardTitle>
									<CardDescription>
										This color will be used for display in your storefront
									</CardDescription>
								</CardHeader>
								<CardContent className="overflow-hidden">
									<ProductPreviewColorselector
										availableColors={availableColors}
										featuredColorId={featuredColorId as string}
										mockupUrl={frontMockupUrl as string}
										selectedColors={selectedColors}
										baseId={currentBaseSkuId}
									/>
								</CardContent>
							</Card>
						)}
						<ExitEditorButton />
					</div>
				</ScrollArea>
			</SidebarContent>
		</Sidebar>
	);
}
