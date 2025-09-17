"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AttributeValue {
  id: string;
  displayName: string;
  hexColor?: string | null;
}

interface Attribute {
  id: string;
  code: string;
  name: string;
  values: AttributeValue[];
}

interface Variant {
  id: string;
  sku: string;
  price: number;
  attributes: Record<string, AttributeValue>;
}

interface ProductVariantSelectorProps {
  availableAttributes: Attribute[];
  variants: Variant[];
  selectedVariant: Variant;
  onVariantChange: (variantId: string) => void;
  className?: string;
}

export function ProductVariantSelector({
  availableAttributes,
  variants,
  selectedVariant,
  onVariantChange,
  className,
}: ProductVariantSelectorProps) {
  // Find a variant that matches the given attribute selections
  const findVariantByAttributes = (targetAttributes: Record<string, string>) => {
    return variants.find(variant => {
      return Object.entries(targetAttributes).every(([attributeCode, valueId]) => {
        return variant.attributes[attributeCode]?.id === valueId;
      });
    });
  };

  // Handle attribute selection
  const handleAttributeSelect = (attributeCode: string, valueId: string) => {
    // Build new attribute selection
    const newAttributes = {
      ...Object.fromEntries(
        Object.entries(selectedVariant.attributes).map(([code, value]) => [code, value.id])
      ),
      [attributeCode]: valueId,
    };

    // Find matching variant
    const matchingVariant = findVariantByAttributes(newAttributes);
    if (matchingVariant) {
      onVariantChange(matchingVariant.id);
    }
  };

  // Check if an attribute value is available (has a matching variant)
  const isAttributeValueAvailable = (attributeCode: string, valueId: string) => {
    const testAttributes = {
      ...Object.fromEntries(
        Object.entries(selectedVariant.attributes).map(([code, value]) => [code, value.id])
      ),
      [attributeCode]: valueId,
    };

    return findVariantByAttributes(testAttributes) !== undefined;
  };

  if (availableAttributes.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {availableAttributes.map((attribute) => {
        const selectedValue = selectedVariant.attributes[attribute.code];

        return (
          <div key={attribute.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                {attribute.name}
              </h3>
              {selectedValue && (
                <span className="text-sm text-gray-600">
                  {selectedValue.displayName}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {attribute.values.map((value) => {
                const isSelected = selectedValue?.id === value.id;
                const isAvailable = isAttributeValueAvailable(attribute.code, value.id);

                // Color swatches for color attributes
                if (attribute.code === "color" && value.hexColor) {
                  return (
                    <motion.button
                      key={value.id}
                      onClick={() => handleAttributeSelect(attribute.code, value.id)}
                      disabled={!isAvailable}
                      className={cn(
                        "relative h-8 w-8 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-gray-900 shadow-md"
                          : "border-gray-200 hover:border-gray-300",
                        !isAvailable && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: value.hexColor }}
                      whileHover={isAvailable ? { scale: 1.1 } : {}}
                      whileTap={isAvailable ? { scale: 0.95 } : {}}
                      title={value.displayName}
                    >
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-full ring-2 ring-gray-900 ring-offset-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 rounded-full bg-gray-200 bg-opacity-50" />
                      )}
                    </motion.button>
                  );
                }

                // Regular buttons for other attributes (size, etc.)
                return (
                  <motion.button
                    key={value.id}
                    onClick={() => handleAttributeSelect(attribute.code, value.id)}
                    disabled={!isAvailable}
                    className={cn(
                      "px-4 py-2 text-sm border rounded-md transition-all",
                      isSelected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-300",
                      !isAvailable && "opacity-50 cursor-not-allowed bg-gray-50"
                    )}
                    whileHover={isAvailable ? { scale: 1.02 } : {}}
                    whileTap={isAvailable ? { scale: 0.98 } : {}}
                  >
                    {value.displayName}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}