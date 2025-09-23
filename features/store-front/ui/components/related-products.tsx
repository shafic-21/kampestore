"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@automattic/format-currency";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RelatedProduct {
  id: string;
  listingTitle: string;
  listingSlug: string;
  baseName: string;
  price: number;
  imageUrl: string;
}

interface RelatedProductsProps {
  title: string;
  products: RelatedProduct[];
  storeSlug: string;
  className?: string;
}

export function RelatedProducts({
  title,
  products,
  storeSlug,
  className,
}: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${storeSlug}/listing/${product.listingSlug}?p=${product.id}`}
            className="group"
          >
            <Card className="p-0 border-none overflow-hidden transition-transform group-hover:scale-105">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={product.imageUrl}
                  alt={product.listingTitle}
                  fill
                  className="object-cover object-center transition-transform group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {product.listingTitle}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {product.baseName}
                </p>
                <p className="text-base font-medium text-gray-900">
                  {formatCurrency(product.price, "UGX")}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}