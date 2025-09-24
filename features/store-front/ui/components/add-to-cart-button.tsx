"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
	productId: string;
	variantId: string;
	variantSku: string;
	isAvailable?: boolean;
	onAddToCart?: (
		productId: string,
		variantId: string,
		quantity: number,
	) => void;
	className?: string;
}

export function AddToCartButton() {
	return (
		<div className={cn("space-y-4")}>
			<Button className="w-full py-3 text-base font-medium" size="lg">
				Add to Cart
			</Button>
		</div>
	);
}
