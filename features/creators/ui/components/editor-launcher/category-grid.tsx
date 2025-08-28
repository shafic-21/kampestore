import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ProductCategory } from "../../types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: ProductCategory;
  className?: string;
}

function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link 
      href={`/products/new?category=${category.slug}`}
      className="group block"
    >
      <div className={cn(
        "relative aspect-[3/2] overflow-hidden rounded-xl",
        "transition-transform duration-300 group-hover:scale-105",
        className
      )}>
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7yl5L6R6LSUSb6JB7"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="font-semibold text-lg">{category.name}</h3>
        </div>
      </div>
    </Link>
  );
}

interface CategoryGridProps {
  categories: ProductCategory[];
  totalProducts: number;
  className?: string;
}

export function CategoryGrid({ categories, totalProducts, className }: CategoryGridProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Trending Categories</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
      
      <div className="flex justify-center pt-4">
        <Button size="lg" className="px-8">
          View all {totalProducts}+ products
        </Button>
      </div>
    </section>
  );
}