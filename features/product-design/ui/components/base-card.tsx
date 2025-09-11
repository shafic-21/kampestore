"use client";


import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card} from "@/components/ui/card";
import { ColorSwatchRow } from "@/components/ui/color-swatch";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@automattic/format-currency";

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
}

export function BaseCard({ base, className, maxColorsVisible =8, isPreEditor = true}: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (isPreEditor) {
      router.push(`/product-design/editor/${base.id}`);
    }


  };

	return (
		<div onClick={handleClick} role="button" className={cn(className)}>
			{/*<Link
				href={`/product-design/editor/${base.id}`}
				className="
			>*/}
				<Card className={cn("p-0 border-none overflow-hidden")}>
					<div className="aspect-square relative overflow-hidden">
						<Image
							src={base.displayImageUrl}
							alt={base.name}
							fill
							className="object-cover object-bottom"
							sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
							placeholder="blur"
							blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7yl5L6R6LSUSb6JB7"
						/>
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
					<p className="text-sm flex justify-start gap-2">
						Base cost
						<span>{formatCurrency(parseInt(`${base.cost}`), "UGX")}</span>
					</p>
					<ColorSwatchRow
						colors={base.colors}
						totalColors={base.totalColors}
						swatchSize="xs"
						maxVisible={maxColorsVisible}
					/>
				</div>
			</div>
		</div>
	);
}
