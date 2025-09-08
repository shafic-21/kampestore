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

/**
 * Normalized placement coordinates (0-1 range relative to print area).
 * Used for applying designs consistently across different products.
 */
export interface NormalizedPlacement {
  /** X position as percentage of print area width (0-1) */
  xPercent: number;

  /** Y position as percentage of print area height (0-1) */
  yPercent: number;

  /** Width as percentage of print area width (0-1) */
  widthPercent: number;

  /** Height as percentage of print area height (0-1) */
  heightPercent: number;

  /** Rotation angle in degrees */
  rotation: number;

  /** Physical width in inches for DPI validation */
  physicalWidthInches: number;

  /** Physical height in inches for DPI validation */
  physicalHeightInches: number;
}
