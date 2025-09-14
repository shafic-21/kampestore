"use client";

import { PackagePlus } from "lucide-react";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useCreationStore } from "@/features/seller/product-creation/_archive/store/use-creation-store";
import { useRouter } from "next/navigation";

export default function SelectJourney() {
	const router = useRouter();

	const { setJourney, setUnsaved } = useCreationStore.getState();

	const goExisting = () => {
		setJourney("existing");
		setUnsaved(false); // reset guard
		router.push("/seller-center/products/new/existing/search");
	};

	const goUnique = () => {
		setJourney("unique");
		setUnsaved(false);
		router.push(`/seller-center/products/new/unique/basic-info`);
	};

	return (
		<div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
			<Card>
				<CardHeader className="pb-4">
					<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
						<Database className="h-6 w-6 text-primary" />
					</div>
					<CardTitle>Sell Existing Catalog Product</CardTitle>
					<CardDescription>
						Match a product already in Kampe’s catalog.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button size="lg" className="w-full" onClick={goExisting}>
						Sell an existing product
					</Button>
				</CardContent>
			</Card>
			<Card className="transition-all hover:border-primary hover:shadow-md max-w-md">
				<CardHeader className="pb-4">
					<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
						<PackagePlus className="h-6 w-6 text-primary" />
					</div>
					<CardTitle>Create New Product</CardTitle>
					<CardDescription>
						Create a fresh catalog entry, then list your offer.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button size="lg" className="w-full" onClick={goUnique}>
						Add a brand-new product
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
