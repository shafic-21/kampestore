import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ProductOffersQueryInput } from "@/features/seller/offer-listing/schemas/product-offers";

/**
 * Fetch paginated seller-offer rows.
 * - POST body lets us send large filter objects without URL limits.
 * - keepPreviousData gives a smooth “infinite scroll”/paginator UX.
 */
export function useSellerOffersQuery(params: ProductOffersQueryInput) {
  /* Stable key — object is fine, TanStack uses deepEqual internally */
  const queryKey = ["seller-offers", params] as const;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error("Failed to fetch seller offers");
      return (await res.json()) as AwaitedReturn;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000, // 30 s – tweak once we have real traffic data
  });
}

type AwaitedReturn = {
  data: Array<{
    offerId: string;
    isVisible: boolean;
    productTitle: string;
    variantTitle: string;
    variantAttributes: Record<string, string>;
    sellerSku: string | null;
    price: string; // matches DB numeric → string in JSON
    stock: number;
    offerStatus: string;
    createdAt: string;
    imageUrl: string | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
};
