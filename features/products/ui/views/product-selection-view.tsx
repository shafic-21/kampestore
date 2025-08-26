"use client";

import { SearchHeader } from "../components/search-header";
import { ProductCard } from "../components/product-card";
import { CategoryGrid } from "../components/category-grid";
import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";
import { useMemo } from "react";
import type { ProductSelectionData } from "../../types";
import { cn } from "@/lib/utils";

interface ProductSelectionViewProps {
  data: ProductSelectionData;
  className?: string;
}

export function ProductSelectionView({ data, className }: ProductSelectionViewProps) {
  const [query] = useQueryState("q", { defaultValue: "" });
  const [activeCategory] = useQueryState("category");

  const filteredProducts = useMemo(() => {
    let filtered = data.products;

    if (query) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.code.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (activeCategory) {
      filtered = filtered.filter(product => 
        product.category.slug === activeCategory
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
                <ProductCard key={product.id} product={product} />
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
                  : `Search Results for "${query}"`
                }
              </h1>
              <span className="text-muted-foreground">
                {filteredProducts.length} products found
              </span>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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