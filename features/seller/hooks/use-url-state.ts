"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  productOffersQuerySchema,
  type ProductOffersQueryInput,
} from "@/features/seller/offer-listing/schemas/product-offers";

export function useUrlState(defaults: ProductOffersQueryInput) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo<ProductOffersQueryInput>(() => {
    const obj: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    const parsed = productOffersQuerySchema.safeParse(obj);
    return parsed.success ? parsed.data : defaults;
  }, [searchParams, defaults]);

  const setState = useCallback(
    (next: (prev: ProductOffersQueryInput) => ProductOffersQueryInput) => {
      const updated = next(state);
      const qs = new URLSearchParams();
      Object.entries(updated).forEach(([k, v]) => {
        if (v === undefined) return;
        Array.isArray(v)
          ? v.forEach((val) => qs.append(k, String(val)))
          : qs.set(k, String(v));
      });
      router.push(`?${qs.toString()}`, { scroll: false });
    },
    [router, state]
  );

  return [state, setState] as const;
}
