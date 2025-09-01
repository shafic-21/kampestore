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

// Editor-specific types
export interface EditorPrintArea {
  id: string;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
  sourceWidthPx: number;
  sourceHeightPx: number;
  dpi: number;
}

export interface EditorView {
  id: string;
  code: string;
  displayName: string;
  order: number;
  sourceWidthPx: number;
  sourceHeightPx: number;
  mockupImageUrl: string | null;
  printArea: EditorPrintArea | null;
}

export interface EditorBaseSku {
  id: string;
  code: string;
  name: string;
}

export interface EditorData {
  baseSku: EditorBaseSku;
  views: EditorView[];
  colors: Array<{
    id: string;
    hexColor: string;
    displayName: string;
  }>;
}

export interface DesignElement {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  scaleX: number;
  scaleY: number;
}

export interface EditorState {
  selectedColors: string[];
  currentView: string;
  designMode: "design" | "preview";
  retailPrice?: number;
  featuredColor?: string;
  designElements: DesignElement[];
}

export type PrintQuality = "poor" | "good" | "great";
