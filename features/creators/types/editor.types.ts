import { TRPCError } from "@trpc/server";

export interface BaseProductCard {
  id: string;
  code: string;
  name: string;
  attributes: string[];
  cost: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  colors: Array<{
    id: string;
    hexColor: string;
    displayName: string;
  }>;
  totalColors: number;
  heroImageUrl: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  productCount: number;
}

export interface ProductSearchFilters {
  query: string;
  category?: string;
  page: number;
  limit: number;
}

export interface ProductSelectionData {
  products: BaseProductCard[];
  categories: ProductCategory[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
}

// Custom error types
export class BaseSkuNotFoundError extends TRPCError {
  constructor(id: string) {
    super({
      code: "NOT_FOUND",
      message: `Base SKU with id '${id}' not found`,
    });
  }
}

export class ColorAttributeNotFoundError extends TRPCError {
  constructor() {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: "Color attribute not configured in system",
    });
  }
}

export class CategoryNotFoundError extends TRPCError {
  constructor(slug: string) {
    super({
      code: "NOT_FOUND",
      message: `Category with slug '${slug}' not found`,
    });
  }
}
