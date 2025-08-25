import { useQuery } from "@tanstack/react-query";

interface SearchParams {
  query: string;
  limit?: number;
}

export function useProductSearch({ query, limit = 20 }: SearchParams) {
  return useQuery({
    queryKey: ["product-search", query, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/catalog/products/search?q=${encodeURIComponent(
          query
        )}&limit=${limit}`
      );
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: query.trim().length > 0,
    staleTime: 30000, // 30 seconds
  });
}
