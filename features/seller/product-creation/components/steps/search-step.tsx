"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Package, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCatalogCreationStore } from "../../store/use-catalog-creation-store";
import { useProductSearch } from "../../hooks/use-product-search";

interface SearchStepProps {
  onNext: () => void;
  onExistingProductSelect: (catalogProductId: string) => void;
  onCreateNew: () => void;
}

interface CatalogProduct {
  id: string;
  title: string;
  gtin?: string;
  hasVariants: boolean;
  canonicalImages?: Array<{
    url: string;
    fileName: string;
  }>;
  brand?: {
    name: string;
  };
  category?: {
    name: string;
  };
}

export default function SearchStep({
  onNext,
  onExistingProductSelect,
  onCreateNew,
}: SearchStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { setError, clearError } = useCatalogCreationStore();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use React Query for search
  const { data, isLoading, error, refetch } = useProductSearch({
    query: debouncedQuery,
  });

  const searchResults: CatalogProduct[] = data?.products || [];
  const hasSearched = debouncedQuery.trim().length > 0;

  // Handle errors
  useEffect(() => {
    if (error) {
      setError("search", "Search failed. Please try again.");
    } else {
      clearError("search");
    }
  }, [error, setError, clearError]);

  const handleSelectProduct = (productId: string) => {
    onExistingProductSelect(productId);
    onNext();
  };

  const handleCreateNew = () => {
    onCreateNew();
    onNext();
  };

  const clearSearch = () => {
    setSearchQuery("");
    clearError("search");
  };

  const getProductImage = (product: CatalogProduct) => {
    return product.canonicalImages?.[0]?.url || "/placeholder.svg";
  };

  const getBrandName = (product: CatalogProduct) => {
    return product.brand?.name || "Unknown Brand";
  };

  const getCategoryName = (product: CatalogProduct) => {
    return product.category?.name || "Uncategorized";
  };

  const getVariantText = (product: CatalogProduct) => {
    return product.hasVariants ? "Has variants" : "Single product";
  };

  const renderSkeletonCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-square bg-muted animate-pulse" />
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded animate-pulse w-20" />
                <div className="h-6 bg-muted rounded animate-pulse w-16" />
              </div>
              <div className="h-9 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Find or Create Product</h2>
          <p className="text-muted-foreground mt-1">
            Search for existing products to create offers, or start fresh with a
            new product
          </p>
        </div>

        {/* Create New Product Button */}
        <Button
          onClick={handleCreateNew}
          variant="outline"
          className="flex items-center gap-2 h-auto px-4 py-3"
        >
          <Plus className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Create New Product</div>
            <div className="text-xs text-muted-foreground">
              Start from scratch
            </div>
          </div>
        </Button>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search existing products by name, brand, or GTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Status */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching products...
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {/* Loading State */}
        {isLoading && renderSkeletonCards()}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Search Error</h3>
            <p className="text-muted-foreground mb-6">
              Unable to search products. Please try again or create a new
              product.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
              <Button onClick={handleCreateNew}>Create New Product</Button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && !error && searchResults.length > 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">
                {searchResults.length} product
                {searchResults.length !== 1 ? "s" : ""} found
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4
                      className="font-medium line-clamp-2 mb-2"
                      title={product.title}
                    >
                      {product.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {getBrandName(product)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryName(product)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getVariantText(product)}
                      </Badge>
                      {product.gtin && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {product.gtin}
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => handleSelectProduct(product.id)}
                      className="w-full"
                      size="sm"
                    >
                      Select This Product
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && !error && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any products matching "{searchQuery}". Try a
              different search term or create a new product.
            </p>
            <Button onClick={handleCreateNew} variant="outline">
              Create New Product Instead
            </Button>
          </div>
        )}

        {/* Initial State */}
        {!isLoading && !hasSearched && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Search for existing products
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start typing to search our catalog. We'll search by product name,
              brand, and GTIN codes for exact matches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
