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
  }, {
    staleTime: 30000, // 30 seconds to prevent duplicate requests
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

  // No client-side filtering - server already filtered the data
  const showNewProducts = !activeCategory && !query;

  return (
    <div className={cn("min-h-screen", className)}>
      <SearchHeader />

      <main className="py-8 space-y-12">
        {showNewProducts && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold">New products</h1>
              <Button variant="link" className="text-base">
                View all
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                {data.products.length} products found
              </span>
            </div>

            {data.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.products.map((product) => (
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
