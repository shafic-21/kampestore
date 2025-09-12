"use client";

import { formatCurrency } from "@automattic/format-currency";
import { CheckIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ColorSwatchRow } from "@/components/ui/color-swatch";
import { cn } from "@/lib/utils";
import { useProductDesignStore } from "../../store";

type Props = {
  base: {
    id: string;
    name: string;
    attributes: string[];
    cost: string;
    colors: Array<{
      id: string;
      hexValue: string;
      displayName: string;
    }>;
    totalColors: number;
    displayImageUrl: string;
  };
  className?: string;
  maxColorsVisible?: number;
  isPreEditor?: boolean;
};

export function BaseCard({
  base,
  className,
  maxColorsVisible = 8,
  isPreEditor = true,
}: Props) {
  const router = useRouter();

  const getProduct = useProductDesignStore((state) => state.getProduct);
  const addProduct = useProductDesignStore((state) => state.addProduct);
  const removeProduct = useProductDesignStore((state) => state.removeProduct);
  const selectedColors = useProductDesignStore(
    (state) => state.editor.selectedColors,
  );

  const isInListing = !!getProduct(base.id);
  const showCheck = !isPreEditor && isInListing;

  const handleClick = () => {
    if (isPreEditor) {
      router.push(`/product-design/editor/${base.id}`);
    } else {
      if (isInListing) {
        removeProduct(base.id);
      } else {
        const colors =
          selectedColors.length > 0
            ? selectedColors
            : base.colors.slice(0, 3).map((c) => c.id);
        addProduct(base.id, colors);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={cn("cursor-pointer", className)}
    >
      <Card
        className={cn(
          "p-0 border-none overflow-hidden",
          showCheck && "ring-2 ring-primary",
        )}
      >
        <div className="aspect-square relative overflow-hidden isolate">
          <Image
            src={base.displayImageUrl}
            alt={base.name}
            fill
            className="object-cover object-bottom"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7yl5L6R6LSUSb6JB7"
          />
          <div className={cn("absolute z-20 top-4 right-4 bg-background ring-1 rounded-sm size-6 grid place-items-center", )}>
            {showCheck ? (
              <CheckIcon className="size-4 text-primary" />
            ) :  <PlusIcon className="size-4 text-primary" />}
          </div>
        </div>
      </Card>
      <div className="space-y-3 mt-4">
        <div className="space-y-1">
          <h3 className="font-medium text-lg leading-tight line-clamp-2">
            {base.name}
          </h3>
          <p className="text-base text-muted-foreground line-clamp-1">
            {base.attributes.join(", ")}
          </p>
        </div>
        <div className="space-y-2">
          {!isPreEditor ? <p className="test-sm">
            Profit starting at {" "}
            <span className="font-semibold text-green-500">{formatCurrency(((Number(base.cost) * 1.2) - Number(base.cost)), "UGX")}</span>
          </p> : <p className="text-sm flex justify-start gap-2">
            Base cost
            <span>{formatCurrency(Number(base.cost), "UGX")}</span>
          </p>}
          <ColorSwatchRow
            colors={base.colors}
            totalColors={base.totalColors}
            swatchSize="xs"
            maxVisible={maxColorsVisible}
          />
        </div>
      </div>
    </button>
  );
}
