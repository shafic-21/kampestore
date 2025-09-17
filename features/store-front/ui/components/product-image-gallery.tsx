"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ProductImageGallery({
  images,
  productName,
  className,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fallback to placeholder if no images
  const displayImages = images.length > 0 ? images : ["https://placehold.co/600x600?text=Product"];
  const selectedImage = displayImages[selectedImageIndex];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image */}
      <motion.div
        className="aspect-square relative overflow-hidden rounded-lg bg-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key={selectedImage}
      >
        <Image
          src={selectedImage}
          alt={productName}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
          priority
        />
      </motion.div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                selectedImageIndex === index
                  ? "border-primary shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Image
                src={image}
                alt={`${productName} view ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}