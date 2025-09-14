import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/features/creators/types";

interface BestsellersSectionProps {
	products: Product[];
}

const formatUgx = (amount: bigint): string => {
	return `UGX ${amount.toLocaleString("en-UG")}`;
};

// Mock data for demonstration
const mockProducts: Product[] = [
	{
		id: "1",
		name: "Unisex Garment-Dyed T-shirt",
		price: BigInt(45000),
		image: "/placeholder-tshirt.jpg",
		category: "Apparel",
		specifications: ["100% Cotton", "Garment-dyed", "Unisex fit", "Soft feel"],
		isBestseller: true,
	},
	{
		id: "2",
		name: "Unisex Heavy Blend Hooded Sweatshirt",
		price: BigInt(85000),
		image: "/placeholder-hoodie.jpg",
		category: "Apparel",
		specifications: [
			"50/50 Cotton-Poly blend",
			"Double-lined hood",
			"Pouch pocket",
			"Air-jet spun yarn",
		],
		isBestseller: true,
	},
	{
		id: "3",
		name: 'Matte Canvas, Stretched, 1.25"',
		price: BigInt(120000),
		image: "/placeholder-canvas.jpg",
		category: "Home & Living",
		specifications: [
			"Premium matte finish",
			'1.25" depth',
			"Gallery wrapped",
			"Ready to hang",
		],
		isBestseller: true,
	},
	{
		id: "4",
		name: "Tough Phone Cases",
		price: BigInt(35000),
		image: "/placeholder-case.jpg",
		category: "Accessories",
		specifications: [
			"Impact resistant",
			"Wireless charging compatible",
			"Precise cutouts",
			"Hybrid construction",
		],
		isBestseller: true,
	},
];

export function BestsellersSection({
	products = mockProducts,
}: BestsellersSectionProps) {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-semibold">Our Bestsellers</h2>
				<Link href="/creator/products/bestsellers">
					<Button
						variant="ghost"
						className="text-primary hover:text-primary/80"
					>
						See more
						<ArrowRight className="w-4 h-4 ml-2" />
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{products.slice(0, 4).map((product) => (
					<Card
						key={product.id}
						className="group hover:shadow-lg transition-all duration-200 overflow-hidden"
					>
						<div className="relative aspect-square bg-muted">
							<div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
								<div className="text-6xl opacity-20">📦</div>
							</div>

							{/* Bestseller Badge */}
							{product.isBestseller && (
								<Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
									<Star className="w-3 h-3 mr-1" />
									Bestseller
								</Badge>
							)}

							{/* Heart Icon */}
							<button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center hover:scale-110 transition-transform">
								<Heart className="w-4 h-4 text-muted-foreground hover:text-red-500" />
							</button>
						</div>

						<CardContent className="p-4">
							<h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
								{product.name}
							</h3>

							<p className="text-lg font-bold text-primary mb-2">
								{formatUgx(product.price)}
							</p>

							<div className="space-y-1">
								{product.specifications.slice(0, 2).map((spec, index) => (
									<p key={index} className="text-xs text-muted-foreground">
										• {spec}
									</p>
								))}
								{product.specifications.length > 2 && (
									<p className="text-xs text-muted-foreground">
										+{product.specifications.length - 2} more
									</p>
								)}
							</div>

							<Button className="w-full mt-4" variant="outline" size="sm">
								Add to Store
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
