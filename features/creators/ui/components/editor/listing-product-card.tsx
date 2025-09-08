"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useListingStore } from "@/features/creators/store/listing-store";
import { useEditorStore } from "@/features/creators/store/editor-store";
import type { ListingProduct } from "@/features/creators/store/listing-store";
import { formatCurrency } from "@automattic/format-currency";
import { trpc } from "@/trpc/client";

interface ListingProductCardProps {
  product: ListingProduct;
  listingId: string | null;
}

/**
 * ListingProductCard Component
 *
 * Displays a horizontal product card in the listing sidebar with 3 sections:
 * 1. Image section - Product preview with design applied in print area
 * 2. Info section - Product name, price, and profit information
 * 3. Actions section - Edit and delete buttons
 *
 * Uses the same print area positioning technique as AddToListingCard
 * with layered rendering: background color → design → mockup overlay.
 */
export function ListingProductCard({
  product,
  listingId,
}: ListingProductCardProps) {
  const router = useRouter();
  const removeProduct = useListingStore((state) => state.removeProduct);

  // Get design file for preview generation
  const designFileId = useListingStore((state) => state.designFileId);
  const getPublishingData = useEditorStore((state) => state.getPublishingData);

  // Fetch real product data using tRPC
  const { data: productData, isLoading } = trpc.baseSkus.getBaseProductById.useQuery(
    { id: product.baseSkuId },
    { 
      retry: 1,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // State for design preview URL
  const [designUrl, setDesignUrl] = useState<string | null>(null);

  // Get the featured color data
  const featuredColor = useMemo(() => {
    if (!productData?.colors) return null;
    return productData.colors.find(color => color.id === product.featuredColorId) || productData.colors[0];
  }, [productData?.colors, product.featuredColorId]);

  // Calculate print area container position (like AddToListingCard)
  const printAreaContainerStyle = useMemo(() => {
    if (!productData?.heroImageUrl) return null;
    
    // For now, use default print area until we get actual print area data
    // This should be updated when we have print areas in the getBaseProductById response
    const defaultPrintArea = {
      x_px: 75,
      y_px: 80,
      width_px: 250,
      height_px: 200,
      sourceWidthPx: 400,
      sourceHeightPx: 400,
    };

    const { x_px, y_px, width_px, height_px, sourceWidthPx, sourceHeightPx } =
      defaultPrintArea;

    // How the source mockup fits in the square container (aspect-square with object-contain)
    const mockupAspect = sourceWidthPx / sourceHeightPx;
    let mockupScale, mockupOffsetX, mockupOffsetY;

    if (mockupAspect > 1) {
      // Mockup wider than tall - fits to width, centered vertically
      mockupScale = 1;
      mockupOffsetX = 0;
      mockupOffsetY = ((1 - 1 / mockupAspect) / 2) * 100;
    } else {
      // Mockup taller than wide - fits to height, centered horizontally
      mockupScale = mockupAspect;
      mockupOffsetX = ((1 - mockupAspect) / 2) * 100;
      mockupOffsetY = 0;
    }

    // Convert print area coordinates to container percentages
    const printLeft =
      mockupOffsetX + (x_px / sourceWidthPx) * 100 * mockupScale;
    const printTop =
      mockupOffsetY + (y_px / sourceHeightPx) * 100 * mockupScale;
    const printWidth = (width_px / sourceWidthPx) * 100 * mockupScale;
    const printHeight = (height_px / sourceHeightPx) * 100 * mockupScale;

    return {
      position: "absolute" as const,
      left: `${printLeft}%`,
      top: `${printTop}%`,
      width: `${printWidth}%`,
      height: `${printHeight}%`,
      overflow: "hidden" as const,
    };
  }, [productData?.heroImageUrl]);

  // Calculate design position within the print area using normalized placement
  const designStyle = useMemo(() => {
    if (!product.placement) return null;

    return {
      position: "absolute" as const,
      left: `${product.placement.xPercent * 100}%`,
      top: `${product.placement.yPercent * 100}%`,
      width: `${product.placement.widthPercent * 100}%`,
      height: `${product.placement.heightPercent * 100}%`,
      transform: `rotate(${product.placement.rotation}deg)`,
      transformOrigin: "top left",
    };
  }, [product.placement]);

  // Create design URL for preview
  useEffect(() => {
    const publishing = getPublishingData();
    if (!publishing?.file) {
      setDesignUrl(null);
      return;
    }
    const url = URL.createObjectURL(publishing.file);
    setDesignUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [getPublishingData, designFileId]);

  // Calculate profit information
  const profit = Math.max(0, product.price - product.baseCost);
  const profitPercentage =
    product.baseCost > 0 ? Math.round((profit / product.baseCost) * 100) : 0;

  /**
   * Navigate to individual product editor with listing context
   */
  const handleEdit = () => {
    if (listingId) {
      router.push(`/editor/${product.baseSkuId}?listingId=${listingId}`);
    }
  };

  /**
   * Remove product from listing - now enabled for all products
   */
  const handleDelete = () => {
    removeProduct(product.baseSkuId);
  };

  // Show loading state while fetching product data
  if (isLoading || !productData) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex gap-3 items-center">
            <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-md animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-16 h-8 bg-muted rounded animate-pulse" />
              <div className="w-16 h-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        product.isIndividuallyEdited && "border-orange-200 bg-orange-50/50",
      )}
    >
      <CardContent className="p-3">
        <div className="flex gap-3 items-center">
          {/* Section 1: Product Image Preview */}
          <div className="w-20 h-20 flex-shrink-0">
            <div className="w-full h-full relative overflow-hidden rounded-md">
              {/* Background Color Layer */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: featuredColor?.hexColor || "#f3f4f6" }}
              />

              {/* Print Area Container - represents the printable area bounds */}
              {printAreaContainerStyle && (
                <div style={printAreaContainerStyle}>
                  {/* Design positioned within print area using normalized coordinates */}
                  {designUrl && designStyle && (
                    <img
                      src={designUrl}
                      alt="Design preview"
                      className="absolute object-contain"
                      style={designStyle}
                    />
                  )}
                </div>
              )}

              {/* Product Mockup Overlay - comes after design for proper layering */}
              <Image
                src={productData.heroImageUrl || "/placeholder-product.png"}
                alt={`${productData.name} mockup`}
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
          </div>

          {/* Section 2: Product Information - Simplified */}
          <div className="flex-1 min-w-0 space-y-1">
            <div>
              <h3 className="font-medium text-sm leading-tight line-clamp-1 truncate">
                {productData.name}
              </h3>
              {product.isIndividuallyEdited && (
                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Custom
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">
                  {formatCurrency(product.price, "UGX")}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Profit:</span>
                <span
                  className={cn(
                    "font-medium",
                    profit > 0 ? "text-green-600" : "text-muted-foreground",
                  )}
                >
                  {formatCurrency(profit, "UGX")} ({profitPercentage}%)
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Action Buttons */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              className="h-8 px-3"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="h-8 px-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
