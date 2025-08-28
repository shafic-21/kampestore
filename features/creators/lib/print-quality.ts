import type { DesignElement, PrintQuality } from "../types/editor.types";

/**
 * Calculate print quality based on image resolution and scaling
 * @param element - The design element containing image info
 * @param targetDpi - Target DPI for printing (usually 300)
 * @param printAreaWidth - Width of print area in pixels
 * @param printAreaHeight - Height of print area in pixels
 * @returns Print quality rating
 */
export function calculatePrintQuality(
  element: DesignElement,
  targetDpi: number = 300,
  printAreaWidth?: number,
  printAreaHeight?: number
): PrintQuality {
  // Calculate the effective resolution based on scaling
  const actualWidth = element.width;
  const actualHeight = element.height;
  
  // Calculate DPI based on original image size vs current display size
  const effectiveHorizontalDpi = (element.originalWidth / actualWidth) * 72; // Assume web images are 72 DPI
  const effectiveVerticalDpi = (element.originalHeight / actualHeight) * 72;
  
  // Use the lower of the two DPIs (worst case scenario)
  const effectiveDpi = Math.min(effectiveHorizontalDpi, effectiveVerticalDpi);
  
  // Quality thresholds
  const greatThreshold = targetDpi * 0.9;  // 90% of target DPI
  const goodThreshold = targetDpi * 0.7;   // 70% of target DPI
  
  if (effectiveDpi >= greatThreshold) return "great";
  if (effectiveDpi >= goodThreshold) return "good";
  return "poor";
}

/**
 * Get print quality color for UI display
 */
export function getPrintQualityColor(quality: PrintQuality): string {
  switch (quality) {
    case "great":
      return "text-green-600";
    case "good":
      return "text-yellow-600";
    case "poor":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Get print quality background color for badges
 */
export function getPrintQualityBgColor(quality: PrintQuality): string {
  switch (quality) {
    case "great":
      return "bg-green-100 text-green-800";
    case "good":
      return "bg-yellow-100 text-yellow-800";
    case "poor":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Calculate recommended minimum image size for a given print area
 */
export function getRecommendedImageSize(
  printAreaWidthPx: number,
  printAreaHeightPx: number,
  targetDpi: number = 300
): { width: number; height: number } {
  // Convert print area from pixels to inches (assuming 72 DPI display)
  const printAreaWidthInches = printAreaWidthPx / 72;
  const printAreaHeightInches = printAreaHeightPx / 72;
  
  // Calculate recommended pixel dimensions
  return {
    width: Math.ceil(printAreaWidthInches * targetDpi),
    height: Math.ceil(printAreaHeightInches * targetDpi),
  };
}

/**
 * Format print quality message for user display
 */
export function formatPrintQualityMessage(quality: PrintQuality): string {
  switch (quality) {
    case "great":
      return "Excellent print quality - your image will look crisp and clear";
    case "good":
      return "Good print quality - suitable for most applications";
    case "poor":
      return "Low print quality - consider using a higher resolution image";
    default:
      return "Unable to determine print quality";
  }
}