"use client";

import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";
import { useMemo } from "react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { SearchHeader } from "../components/editor/search-header";
import { BaseSkuCard } from "../components/editor/base-sku-card";

interface ProductSelectionViewProps {
  className?: string;
}

export function BaseSelectionView({
  className,
}: ProductSelectionViewProps) {
  const [query] = useQueryState("q", { defaultValue: "" });
  const [activeCategory] = useQueryState("category");
  const [page] = useQueryState("page", { defaultValue: "1" });

  // Fetch data using tRPC React Query hooks
  const { data, isLoading, isError } = trpc.baseSkus.listBaseProducts.useQuery({
    query,
    category: activeCategory || undefined,
    page: parseInt(page, 10),
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Failed to load products</div>
      </div>
    );
  }

  const filteredProducts = useMemo(() => {
    let filtered = data.products;

    if (query) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase()) ||
          product.code.toLowerCase().includes(query.toLowerCase()),
      );
    }

    if (activeCategory) {
      filtered = filtered.filter(
        (product) => product.category.slug === activeCategory,
      );
    }

    return filtered;
  }, [data.products, query, activeCategory]);

  const showNewProducts = !activeCategory && !query;

  return (
    <div className={cn("min-h-screen", className)}>
      <SearchHeader />

      <main className="px-8 py-8 space-y-12">
        {showNewProducts && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold">New products</h1>
              <Button variant="link" className="text-base">
                View all
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.products.slice(0, 4).map((product) => (
                <BaseSkuCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {(query || activeCategory) && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold">
                {activeCategory
                  ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Products`
                  : `Search Results for "${query}"`}
              </h1>
              <span className="text-muted-foreground">
                {filteredProducts.length} products found
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <BaseSkuCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or browse our categories below.
                </p>
              </div>
            )}
          </section>
        )}

        {/*{showNewProducts && (
          <CategoryGrid
            categories={data.categories}
            totalProducts={data.totalProducts}
          />
        )}*/}
      </main>
    </div>
  );
}
