"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useProductDesignStore } from "../../store";
import type { CachedProduct } from "../../types/store.types";
import { createColorMap } from "../../utils";

type Props = {
	availableColors: {
		id: string;
		code: string;
		displayName: string;
		hexValue: string;
	}[];
	selectedColors: string[];
	featuredColorId: string;
	mockupUrl: string;
	baseId: string;
};

export function ProductPreviewColorselector({
	selectedColors,
	featuredColorId,
	mockupUrl,
	availableColors,
	baseId,
}: Props) {
	const [api, setApi] = useState<CarouselApi>();
	const setFeaturedColor = useProductDesignStore(
		(state) => state.setFeaturedColor,
	);

	const colorMap = createColorMap(availableColors);

	useEffect(() => {
		if (featuredColorId && api) {
			const selectedIndex = selectedColors.indexOf(featuredColorId);
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
					key="first-spacer"
					className="basis-auto h-14 w-4 grid place-items-center cursor-pointer"
				/>
				{selectedColors
					.filter((colorId) => colorMap[colorId]) // Only render colors that exist in colorMap
					.map((colorId) => (
						<CarouselItem
							key={colorId}
							className="basis-auto size-14 grid place-items-center cursor-pointer"
							onClick={() => setFeaturedColor(colorId, baseId)}
						>
							<div
								role="button"
								className={cn(
									"size-12 relative isolate rounded-sm overflow-hidden ring-2 ring-offset-0",
									featuredColorId === colorId ? "ring-primary" : "ring-border",
								)}
							>
								{mockupUrl && (
									<Image
										src={mockupUrl}
										alt={`${colorMap[colorId].displayName} preview`}
										fill
										className="object-contain aspect-square"
										sizes="36px"
									/>
								)}
								<div
									className="absolute -z-10 top-1/2 left-1/2 -translate-1/2 w-[calc(100%-6px)] h-[calc(100%-6px)]"
									style={{ backgroundColor: colorMap[colorId].hexValue }}
								/>
							</div>
						</CarouselItem>
					))}
				<CarouselItem
					key="last-spacer"
					className="basis-auto h-14 w-8 grid place-items-center cursor-pointer"
				/>
			</CarouselContent>
		</Carousel>
	);
}
