"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductColor } from "@/features/creators/types/canvas.types";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { useShallow } from "zustand/react/shallow";
import { useEditorStore } from "@/features/creators/store/editor-store";

export function ProductPreviewColorselector() {
	const [api, setApi] = useState<CarouselApi>();
	const { selectedColors, featuredColorId, editorData } = useEditorStore(
		useShallow((state) => ({
			selectedColors: state.selectedColors,
			editorData: state.editorData,
			featuredColorId: state.featuredColorId,
		})),
	);

	const mockupUrl =
		editorData?.views?.find((view) => view.code === "front")?.mockupImageUrl ||
		"";

	const selectedColorObjects = useMemo(() => {
		if (!editorData?.colors || selectedColors.length === 0) {
			return [];
		}

		// Filter available colors to only include selected ones, maintaining order
		return selectedColors
			.map((colorId) => editorData.colors.find((color) => color.id === colorId))
			.filter(Boolean) as typeof editorData.colors;
	}, [editorData?.colors, selectedColors]);

	const setFeaturedColor = useEditorStore((state) => state.setFeaturedColor);

	// Effect to scroll to selected color when it changes
	useEffect(() => {
		if (featuredColorId && api) {
			const selectedIndex = selectedColors.findIndex(
				(color) => color === featuredColorId,
			);
			if (selectedIndex !== -1) {
				api.scrollTo(selectedIndex);
			}
		}
	}, [featuredColorId, selectedColors, api]);

	return (
		<Carousel
			setApi={setApi}
			opts={{
				align: "start",
				dragFree: true,
				containScroll: "trimSnaps",
			}}
			className="w-[260px]"
		>
			<CarouselContent className="ml-1">
				<CarouselItem
					key={"first Items"}
					className="basis-auto h-14 w-4 grid place-items-center cursor-pointer"
				></CarouselItem>
				{selectedColorObjects.map((color) => (
					<CarouselItem
						key={color.id}
						className="basis-auto size-14 grid place-items-center cursor-pointer"
						onClick={() => setFeaturedColor(color.id)}
					>
						<div
							role="button"
							className={cn(
								"size-12 relative isolate rounded-sm overflow-hidden ring-2 ring-offset-0",
								featuredColorId == color.id ? "ring-primary" : "ring-border",
							)}
						>
							<Image
								src={mockupUrl}
								alt={`${color.displayName} preview`}
								fill
								className="object-contain aspect-square"
								sizes="36px"
							/>
							<div
								className="absolute -z-10 top-1/2 left-1/2 -translate-1/2 w-[calc(100%-6px)] h-[calc(100%-6px)]"
								style={{ backgroundColor: color.hexColor }}
							/>
						</div>
					</CarouselItem>
				))}
				<CarouselItem
					key={"last item"}
					className="basis-auto h-14 w-8 grid place-items-center cursor-pointer"
				></CarouselItem>
			</CarouselContent>
		</Carousel>
	);
}
