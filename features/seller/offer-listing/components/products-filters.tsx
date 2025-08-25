"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { useProductsStore } from "@/features/seller/offer-listing/stores/products-store";
import { useCategoriesQuery } from "@/features/categories/services/use-categories-query";

export function ProductsFilters({
  initialCategory,
  initialSearch,
}: {
  initialCategory?: string;
  initialSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(initialSearch || "");
  const [category, setCategory] = useState(initialCategory || "");
  const [openCategory, setOpenCategory] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);


  const { data: categoryOptions} =
    useCategoriesQuery({
      level: "leaf",
    });

  const { setFilters } = useProductsStore();

  useEffect(() => {
    setFilters({
      category: initialCategory || "",
      search: initialSearch || "",
    });
  }, [initialCategory, initialSearch, setFilters]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (category) params.set("categoryId", category);
    if (debouncedSearch) params.set("search", debouncedSearch);

    params.set("page", "1");

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });

    setFilters({
      category,
      search: debouncedSearch,
    });
  }, [debouncedSearch, category, pathname, router, setFilters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (category) params.set("categoryId", category);
    if (searchQuery) params.set("search", searchQuery);

    params.set("page", "1");

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });

    setFilters({
      category,
      search: searchQuery,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategory("");
    router.push(pathname, { scroll: false });
    setFilters({
      category: "",
      search: "",
    });
  };

  const getSelectedCategoryLabel = () => {
    const selected = categoryOptions?.find((option) => option.id === category);
    return selected ? selected.name : "All Categories";
  };

  return (
    <div className="flex justify-between  gap-12 mb-8">
      <div className="flex flex-col gap-2 w-full">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by Name, SKU, or GTIN"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      <div className="flex gap-4">
        <div className="w-full min-w-[280px]">
          <Popover open={openCategory} onOpenChange={setOpenCategory}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCategory}
                className="w-full justify-between"
              >
                {getSelectedCategoryLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start" sideOffset={5}>
              <Command>
                <CommandInput
                  placeholder="Search category..."
                  value={category}
                />
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup>
                    {categoryOptions?.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.name}
                        onSelect={(value) => {
                          setCategory(value === category ? "" : option.id);
                          setOpenCategory(false);
                        }}
                      >
                        {option.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button variant={"secondary"} className="" disabled={!Boolean(category) || Boolean(searchQuery)} onClick={handleClearFilters}>
          Clear Filters 
        </Button>
      </div>
    </div>
  );
}
