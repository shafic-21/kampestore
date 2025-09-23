"use client";

import { ShoppingCartIcon } from "lucide-react";
import {
	ResponsiveSheet,
	ResponsiveSheetClose,
	ResponsiveSheetContent,
	ResponsiveSheetFooter,
	ResponsiveSheetHeader,
	ResponsiveSheetTitle,
	ResponsiveSheetTrigger,
} from "@/components/responsive-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CartSheetProps {
	isSignedIn?: boolean;
	cartItemsCount?: number;
}

export function CartSheet({
	isSignedIn = false,
	cartItemsCount = 0,
}: CartSheetProps) {
	return (
		<ResponsiveSheet>
			<ResponsiveSheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Shopping cart"
					className="relative"
				>
					<ShoppingCartIcon className="h-5 w-5" />
					{cartItemsCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
						>
							{cartItemsCount > 99 ? "99+" : cartItemsCount}
						</Badge>
					)}
				</Button>
			</ResponsiveSheetTrigger>

			<ResponsiveSheetContent side="right" className="w-full sm:max-w-md">
				<ResponsiveSheetHeader>
					<ResponsiveSheetTitle className="flex items-center gap-2">
						My Cart
						{cartItemsCount > 0 && (
							<Badge variant="secondary" className="ml-auto">
								{cartItemsCount} {cartItemsCount === 1 ? "item" : "items"}
							</Badge>
						)}
					</ResponsiveSheetTitle>
				</ResponsiveSheetHeader>

				<div className="flex-1 py-4">
					{cartItemsCount === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<p className="text-muted-foreground">Your cart is empty</p>
						</div>
					) : (
						<div className="space-y-4">
							{/* Cart items will be rendered here */}
							<div className="text-sm text-muted-foreground">
								Cart items will be displayed here
							</div>
						</div>
					)}
				</div>

				<ResponsiveSheetFooter className="border-t pt-4">
					{cartItemsCount > 0 && (
						<div className="space-y-4 w-full">
							<div className="flex justify-between items-center text-lg font-semibold">
								<span>Subtotal:</span>
								<span>UGX 0</span>
							</div>

							{isSignedIn ? (
								<Button className="w-full" size="lg">
									Continue to Checkout
								</Button>
							) : (
								<Button className="w-full" size="lg">
									Sign In to Checkout
								</Button>
							)}
						</div>
					)}

					{cartItemsCount === 0 && (
						<ResponsiveSheetClose asChild>
							<Button className="w-full" variant="secondary" size="lg">
								Continue Shopping
							</Button>
						</ResponsiveSheetClose>
					)}
				</ResponsiveSheetFooter>
			</ResponsiveSheetContent>
		</ResponsiveSheet>
	);
}
