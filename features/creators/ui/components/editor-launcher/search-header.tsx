"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

const navigationItems = [
	{ label: "New Products", value: "new" },
	{ label: "Best Sellers", value: "bestsellers" },
	{ label: "Apparel", value: "apparel" },
	{ label: "Accessories", value: "accessories" },
	{ label: "Digital", value: "digital" },
	{ label: "Home & Living", value: "home" },
];

interface SearchHeaderProps {
	className?: string;
}

export function SearchHeader({ className }: SearchHeaderProps) {
	const [query, setQuery] = useQueryState("q", { defaultValue: "" });
	const [activeCategory, setActiveCategory] = useQueryState("category");

	return (
		<div
			className={cn(
				"sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full",
				className,
			)}
		>
			<div className="px-8 py-4 space-y-4 ">
				<div className="flex items-center gap-4">
					<div className="relative flex-1 ">
						<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="I am looking for..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-10 h-10"
						/>
					</div>
				</div>

				<nav className="flex items-center gap-1 overflow-x-auto">
					<Button
						variant={"ghost"}
						onClick={() => setActiveCategory(null)}
						className={cn(
							"whitespace-nowrap",
							activeCategory === null && "bg-muted",
						)}
					>
						All
					</Button>
					{navigationItems.map((item) => (
						<Button
							key={item.value}
							variant={"ghost"}
							onClick={() => setActiveCategory(item.value)}
							className={cn(
								"whitespace-nowrap",
								activeCategory === item.value && "bg-muted",
							)}
						>
							{item.label}
						</Button>
					))}
				</nav>
			</div>
		</div>
	);
}
