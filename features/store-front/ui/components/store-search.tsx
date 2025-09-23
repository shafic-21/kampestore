"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface StoreSearchProps {
  placeholder?: string;
  className?: string;
}

export function StoreSearch({
  placeholder = "Search for products...",
  className
}: StoreSearchProps) {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    shallow: false,
  });

  const [inputValue, setInputValue] = useState(searchQuery || "");
  const debouncedSearchValue = useDebounce(inputValue, 300);

  // Update URL when debounced value changes
  if (debouncedSearchValue !== searchQuery) {
    setSearchQuery(debouncedSearchValue || null);
  }

  return (
    <div className={cn("mx-auto w-full max-w-7xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full pl-10 text-base md:text-lg h-12 md:h-14"
        />
      </div>
    </div>
  );
}