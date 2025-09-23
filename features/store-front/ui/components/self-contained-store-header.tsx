"use client";

import { Search, UserIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CartSheet } from "@/features/store-front/ui/components/cart-sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { trpc } from "@/trpc/client";

interface SelfContainedStoreHeaderProps {
	storeSlug: string;
	isSignedIn?: boolean;
	cartItemsCount?: number;
}

export function SelfContainedStoreHeader({
	storeSlug,
	isSignedIn = false,
	cartItemsCount = 0,
}: SelfContainedStoreHeaderProps) {
	const [searchQuery, setSearchQuery] = useQueryState("search", {
		defaultValue: "",
		shallow: false,
	});

	const [categorySlug, setCategorySlug] = useQueryState("category", {
		defaultValue: "",
	});

	const [inputValue, setInputValue] = useState(searchQuery || "");
	const debouncedSearchValue = useDebounce(inputValue, 300);

	// Fetch store data
	const { data: store, isLoading: storeLoading } = trpc.storeFront.getStoreBySlug.useQuery(
		{ slug: storeSlug }
	);

	// Fetch categories
	const { data: categories } = trpc.storeFront.getStoreCategories.useQuery(
		{ storeSlug },
		{
			enabled: !!store
		}
	);

	// Update URL when debounced value changes
	if (debouncedSearchValue !== searchQuery) {
		setSearchQuery(debouncedSearchValue || null);
	}

	const handleCategoryChange = (category: string | null) => {
		setCategorySlug(category || null);
	};

	// Show loading state
	if (storeLoading || !store) {
		return (
			<header className="border-b bg-background">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between gap-2 lg:gap-4">
						<div className="flex-shrink-0">
							<div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
						</div>
						<div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 max-w-2xl">
							<div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
							<div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
						</div>
						<div className="flex items-center space-x-1 sm:space-x-2">
							<div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
							<div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
						</div>
					</div>
				</div>
			</header>
		);
	}

	return (
		<header className="border-b bg-background">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between gap-2 lg:gap-4">
					{/* Store Name - Left */}
					<div className="flex-shrink-0">
						<h1 className="text-lg lg:text-xl font-bold text-foreground">
							{store.storeName}
						</h1>
					</div>

					{/* Categories and Search - Center */}
					<div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 max-w-2xl">
						<Select
							value={categorySlug || "all"}
							onValueChange={(value) =>
								handleCategoryChange(value === "all" ? null : value)
							}
						>
							<SelectTrigger className="w-fit min-w-[120px] sm:min-w-[160px] h-10">
								<SelectValue placeholder="All Categories" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{categories?.map((category) => (
									<SelectItem key={category.id} value={category.slug}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search products..."
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								className="w-full pl-10 h-10"
							/>
						</div>
					</div>

					{/* User and Cart Buttons - Right */}
					<div className="flex items-center space-x-1 sm:space-x-2">
						<Button variant="ghost" size="icon" aria-label="User account">
							<UserIcon className="h-5 w-5" />
						</Button>
						<CartSheet
							isSignedIn={isSignedIn}
							cartItemsCount={cartItemsCount}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}