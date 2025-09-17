"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  variantSku: string;
  isAvailable?: boolean;
  onAddToCart?: (productId: string, variantId: string, quantity: number) => void;
  className?: string;
}

export function AddToCartButton({
  productId,
  variantId,
  variantSku,
  isAvailable = true,
  onAddToCart,
  className,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleAddToCart = async () => {
    if (!isAvailable || isAdding) return;

    setIsAdding(true);
    try {
      // TODO: Implement actual cart functionality
      console.log("Adding to cart:", { productId, variantId, variantSku, quantity });

      if (onAddToCart) {
        onAddToCart(productId, variantId, quantity);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 font-medium">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="p-2 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <motion.div
        whileHover={isAvailable ? { scale: 1.02 } : {}}
        whileTap={isAvailable ? { scale: 0.98 } : {}}
      >
        <Button
          onClick={handleAddToCart}
          disabled={!isAvailable || isAdding}
          className="w-full py-3 text-base font-medium"
          size="lg"
        >
          {isAdding ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Adding to Cart...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>
                {isAvailable ? "Add to Cart" : "Out of Stock"}
              </span>
            </div>
          )}
        </Button>
      </motion.div>

      {/* SKU Information */}
      <div className="text-sm text-gray-500">
        SKU: {variantSku}
      </div>
    </div>
  );
}