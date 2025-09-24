"use client";

import { formatCurrency } from "@automattic/format-currency";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColorSwatchRow } from "@/components/ui/color-swatch";
import { cn } from "@/lib/utils";
import { ProductDetailsPreview } from "./product-details-preview";

type Props = {
	product: {
		id: string;
		listingTitle: string;
		listingSlug: string;
		baseName: string;
		price: number;
		defaultImageUrl: string;
		colors: Array<{
			id: string;
			hexValue: string;
			displayName: string;
		}>;
		totalColors: number;
	};
	storeSlug: string;
	className?: string;
	maxColorsVisible?: number;
};

export function ProductCard({
	product,
	storeSlug,
	maxColorsVisible = 8,
}: Props) {
	const productUrl = `/stores/${storeSlug}/listing/${product.listingSlug}?p=${product.id}`;

	return (
		<div className="block">
			<Link
				href={productUrl}
				className={cn("p-0 border-none overflow-hidden transition-transform")}
			>
				<div className="aspect-square relative overflow-hidden isolate">
					<Image
						src={product.defaultImageUrl}
						alt={product.listingTitle}
						fill
						className="object-cover object-bottom transition-transform group-hover:scale-110"
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
						placeholder="blur"
						blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7yl5L6R6LSUSb6JB7"
					/>
				</div>
			</Link>
			<div className="space-y-3 mt-4">
				<div className="space-y-1">
					<h3 className="font-medium text-lg leading-tight line-clamp-2 text-left group-hover:text-primary transition-colors">
						{product.listingTitle}
					</h3>
					<p className="text-base text-muted-foreground line-clamp-1 text-left">
						{product.baseName}
					</p>
				</div>
				<div className="flex justify-between items-end">
					<div className="flex flex-col gap-2 text-left">
						<p className="text-base font-medium">
							{formatCurrency(Number(product.price), "UGX")}
						</p>
						<ColorSwatchRow
							colors={product.colors}
							totalColors={product.totalColors}
							swatchSize="xs"
							maxVisible={maxColorsVisible}
						/>
					</div>
					{product.colors.length > 1 ? (
						<ProductDetailsPreview productId={product.id} />
					) : (
						<Button size={"sm"}>Add to Cart</Button>
					)}
				</div>
			</div>
		</div>
	);
}
