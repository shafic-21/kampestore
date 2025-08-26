export interface BaseProductCard {
  id: string;
  code: string;
  name: string;
  description: string;
  cost: bigint;
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