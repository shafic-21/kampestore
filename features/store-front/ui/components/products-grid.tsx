import { SearchIcon } from "lucide-react";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface ProductsGridProps {
  products: Array<{
    id: string;
    listingTitle: string;
    listingSlug: string;
    baseName: string;
    price: number;
    defaultImageUrl: string;
    colors: Array<{
      id: string;
      hexValue: string;
      displayName: string;
    }>;
    totalColors: number;
  }>;
  storeSlug: string;
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPageChange?: (page: number) => void;
  className?: string;
}

function ProductSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="size-4 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center size-16 rounded-full bg-muted mb-4">
        <SearchIcon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-center mb-2">
        No products found
      </h3>
      <p className="text-muted-foreground text-center max-w-sm">
        We couldn't find any products matching your criteria. Try adjusting your search or filters.
      </p>
    </div>
  );
}

function PaginationControls({
  pagination,
  onPageChange
}: {
  pagination: NonNullable<ProductsGridProps['pagination']>;
  onPageChange?: (page: number) => void;
}) {
  const { page, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(page - 1)}
            style={{
              pointerEvents: hasPreviousPage ? 'auto' : 'none',
              opacity: hasPreviousPage ? 1 : 0.5
            }}
          />
        </PaginationItem>

        {getVisiblePages().map((pageNum, index) => (
          <PaginationItem key={index}>
            {pageNum === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => handlePageChange(pageNum as number)}
                isActive={pageNum === page}
              >
                {pageNum}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(page + 1)}
            style={{
              pointerEvents: hasNextPage ? 'auto' : 'none',
              opacity: hasNextPage ? 1 : 0.5
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function ProductsGrid({
  products,
  storeSlug,
  isLoading = false,
  pagination,
  onPageChange,
  className,
}: ProductsGridProps) {
  if (isLoading) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product,index) => (
          <ProductCard
            key={product.id + index}
            product={product}
            storeSlug={storeSlug}
          />
        ))}
      </div>

      {pagination && (
        <div className="mt-12 flex justify-center">
          <PaginationControls
            pagination={pagination}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
