"use client";

import { useQueryState } from "nuqs";
import { trpc } from "@/trpc/client";
import { ProductsGrid } from "../components/products-grid";
import { StoreFooter } from "../components/store-footer";
import { StoreHeader } from "../components/store-header";
import { StoreHero } from "../components/store-hero";

interface StorePageViewProps {
	storeSlug: string;
}

export function StorePageView({ storeSlug }: StorePageViewProps) {
	// URL state management with nuqs
	const [search, setSearch] = useQueryState("search", { defaultValue: "" });
	const [categorySlug, setCategorySlug] = useQueryState("category", {
		defaultValue: "",
	});
	const [page, setPage] = useQueryState("page", {
		defaultValue: "1",
		parse: (value) => Math.max(1, parseInt(value) || 1).toString(),
		serialize: (value) => value,
	});

	// Parse page as number for API calls
	const currentPage = parseInt(page) || 1;

	// Build filters object
	const filters = {
		search: search || undefined,
		categorySlug: categorySlug || undefined,
		page: currentPage,
		pageSize: 12,
	};

	// tRPC queries
	const {
		data: store,
		isLoading: storeLoading,
		error: storeError,
	} = trpc.storeFront.getStoreBySlug.useQuery({ slug: storeSlug });

	const {
		data: productsData,
		isLoading: productsLoading,
		error: productsError,
	} = trpc.storeFront.getStoreProducts.useQuery(
		{ storeSlug, ...filters },
		{
			enabled: !!store,
		},
	);

	// Handle loading states
	if (storeLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	// Handle error states
	if (storeError || !store) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						Store Not Found
					</h1>
					<p className="text-gray-600">
						The store you're looking for doesn't exist or has been removed.
					</p>
				</div>
			</div>
		);
	}

	// Handle inactive store
	if (store.status !== "active") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						Store Unavailable
					</h1>
					<p className="text-gray-600">
						This store is currently not available.
					</p>
				</div>
			</div>
		);
	}

	const handlePageChange = (newPage: number) => {
		setPage(newPage.toString());
		// Scroll to top on page change
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="min-h-screen flex flex-col">
			{/* Store Header */}
			<StoreHeader storeSlug={storeSlug} />

			{/* Main Content */}
			<main className="flex-1">
				{/* Hero Section - Only render if bannerR2Key exists */}
				{store.bannerR2Key && (
					<StoreHero
						bannerR2Key={store.bannerR2Key}
						bannerAction={store.bannerAction}
						storeName={store.storeName}
					/>
				)}

				{/* Products Section */}
				<div className="py-12">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						{/* Products Grid */}
						{productsError ? (
							<div className="text-center py-12">
								<p className="text-gray-600">
									Failed to load products. Please try again later.
								</p>
							</div>
						) : (
							<ProductsGrid
								products={productsData?.products || []}
								storeSlug={storeSlug}
								pagination={productsData?.pagination}
								isLoading={productsLoading}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</div>
			</main>

			{/* Store Footer */}
			<StoreFooter
				storeName={store.storeName}
				displaySocialsOnStore={store.displaySocialsOnStore}
				socialLinks={{
					xUrl: store.xUrl,
					instagramUrl: store.instagramUrl,
					facebookUrl: store.facebookUrl,
					tiktokUrl: store.tiktokUrl,
				}}
			/>
		</div>
	);
}
