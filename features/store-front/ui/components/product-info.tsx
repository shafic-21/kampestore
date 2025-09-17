"use client";

import { formatCurrency } from "@automattic/format-currency";
import { cn } from "@/lib/utils";

interface ProductInfoProps {
  listingTitle: string;
  productName: string;
  price: number;
  className?: string;
}

export function ProductInfo({
  listingTitle,
  productName,
  price,
  className,
}: ProductInfoProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {listingTitle}
      </h1>
      <p className="text-lg text-gray-600">
        {productName}
      </p>
      <div className="pt-2">
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(price, "UGX")}
        </p>
      </div>
    </div>
  );
}