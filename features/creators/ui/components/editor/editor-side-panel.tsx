"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	sidebarMenuButtonVariants,
	SidebarMenuItem,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState, useRef, useEffect } from "react";
import { ExitEditorButton } from "./exit-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorSwatch, ColorSwatchRow } from "@/components/ui/color-swatch";
import { ProductPreviewColorselector } from "./product-color-preview";
import { useEditorStore } from "../../../store/editor-store";
import { useShallow } from "zustand/react/shallow";

export function EditorSidePanel({ ...props }) {
	const { state } = useSidebar();

	// ===== ZUSTAND STORE CONNECTION =====
	// Get editor data, color management state, and pricing from store
	const { editorData, selectedColors, featuredColorId, customerPrice } =
		useEditorStore(
			useShallow((state) => ({
				editorData: state.editorData,
				selectedColors: state.selectedColors,
				featuredColorId: state.featuredColorId,
				customerPrice: state.customerPrice,
			})),
		);

	// Get color management actions from store
	const toggleColorSelection = useEditorStore(
		(state) => state.toggleColorSelection,
	);

	// Get pricing management action from store
	const setCustomerPrice = useEditorStore((state) => state.setCustomerPrice);

	// ===== LOCAL STATE (Non-store state only) =====
	const [selectedView, setSelectedView] = useState<string>("front");
	// String version of customerPrice for input field
	const [priceInputValue, setPriceInputValue] = useState<string>(
		customerPrice.toString(),
	);

	// ===== COMPUTED VALUES =====
	// Numeric base cost (server may return string)
	const baseCost = useMemo(
		() => Number(editorData?.baseSku?.cost ?? 0),
		[editorData?.baseSku?.cost],
	);

	// Parse the user's typed value to reflect UI state immediately
	const typedPrice = useMemo(() => {
		if (priceInputValue === "") return NaN;
		const n = Number(priceInputValue);
		return Number.isFinite(n) ? n : NaN;
	}, [priceInputValue]);

	// Red state when user tries to set a price below base cost
	const isBelowCost = useMemo(
		() => Number.isFinite(typedPrice) && typedPrice < baseCost,
		[typedPrice, baseCost],
	);

	// Display profit uses typed value if available; otherwise falls back to store value
	const displayProfit = useMemo(() => {
		const price = Number.isFinite(typedPrice)
			? (typedPrice as number)
			: customerPrice;
		return Math.max(0, price - baseCost);
	}, [typedPrice, customerPrice, baseCost]);

	// Get available colors from editor data (replaces AVAILABLE_COLORS hardcoded array)
	const availableColors = editorData?.colors || [];
	// Get base color options from selected colors (filtered from available colors)

	// Get front view mockup URL for the color previews

	// ===== EARLY RETURN FOR LOADING =====
	if (!editorData) {
		return (
			<Sidebar
				collapsible="none"
				{...props}
				className="px-4 h-screen"
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

	// ===== EVENT HANDLERS =====
	/**
	 * Handle color selection toggle.
	 * Uses store action that manages the business logic for adding/removing colors
	 * and automatically updates the featured color when needed.
	 */
	const handleColorToggle = (colorId: string) => {
		toggleColorSelection(colorId);
	};

	/**
	 * Handle price input changes.
	 * Updates both the input field (string) and the store (number) values.
	 */
	const handlePriceChange = (value: string) => {
		// Only allow numbers
		const numericValue = value.replace(/[^0-9]/g, "");
		const priceNum = Number.parseFloat(numericValue) || 0;
		const baseCost = editorData?.baseSku?.cost || 0;

		// Update input field immediately for better UX
		setPriceInputValue(numericValue);

		// Don't allow values below base cost (but allow empty for editing)
		if (priceNum >= baseCost || numericValue === "") {
			// Only update store if it's a valid price (not empty)
			if (numericValue !== "" && priceNum > 0) {
				setCustomerPrice(priceNum);
			}
		}
	};

	return (
		<Sidebar
			collapsible="none"
			{...props}
			className="px-4 h-screen"
			style={{ width: "400px" }}
		>
			<SidebarContent>
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
											isSelected={selectedColors.includes(color.id)}
											isSelectable={true}
											isDisabled={
												selectedColors.length >= 5 &&
												!selectedColors.includes(color.id)
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
									<ProductPreviewColorselector />
								</CardContent>
							</Card>
						)}
					</div>
				</ScrollArea>
			</SidebarContent>
			<SidebarFooter>
				<ExitEditorButton />
			</SidebarFooter>
		</Sidebar>
	);
}
