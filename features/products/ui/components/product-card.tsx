"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ColorSwatchRow } from "./color-swatch";
import { formatUgxCurrency } from "../../lib/utils";
import type { BaseProductCard } from "../../types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: BaseProductCard;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <div>
      <Link href={`/creators/editor/${product.id}`} className="group block">
        <Card className={cn("p-0 border-none overflow-hidden", className)}>
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={product.heroImageUrl}
              alt={product.name}
              fill
              className="object-cover object-bottom"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7yl5L6R6LSUSb6JB7"
            />
          </div>
        </Card>
      </Link>
      <div className="space-y-3 mt-4">
        <div className="space-y-1">
          <h3 className="font-medium text-lg leading-tight line-clamp-2">
            {product.name}
          </h3>
          <p className="text-base text-muted-foreground line-clamp-1">
            {product.description}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">Base cost {formatUgxCurrency(product.cost)}</p>
          <ColorSwatchRow
            colors={product.colors}
            totalColors={product.totalColors}
            maxVisible={6}
          />
        </div>
      </div>
    </div>
  );
}
