import type { ColorProfile } from "../types/store.types";

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  return { r, g, b };
}

/**
 * Convert RGB to LAB color space for perceptual color distance calculation
 */
function rgbToLab(hex: string): { l: number; a: number; b: number } {
  const { r, g, b } = hexToRgb(hex);

  // Normalize RGB values
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;

  // Apply gamma correction
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

  // Convert to XYZ
  const x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
  const y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
  const z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

  // Normalize by D65 illuminant
  const xNorm = x / 0.95047;
  const yNorm = y / 1.00000;
  const zNorm = z / 1.08883;

  // Convert to LAB
  const fx = xNorm > 0.008856 ? Math.pow(xNorm, 1/3) : (7.787 * xNorm + 16/116);
  const fy = yNorm > 0.008856 ? Math.pow(yNorm, 1/3) : (7.787 * yNorm + 16/116);
  const fz = zNorm > 0.008856 ? Math.pow(zNorm, 1/3) : (7.787 * zNorm + 16/116);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b_lab = 200 * (fy - fz);

  return { l, a, b: b_lab };
}

/**
 * Calculate perceptual color distance using simplified Delta E
 */
function calculateColorDistance(hex1: string, hex2: string): number {
  const lab1 = rgbToLab(hex1);
  const lab2 = rgbToLab(hex2);

  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;

  // Simplified Delta E (not CIE2000 but good enough for our purposes)
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Check if two colors have good contrast (distance > threshold)
 */
function isGoodContrast(designColor: string, productColor: string, threshold = 30): boolean {
  return calculateColorDistance(designColor, productColor) > threshold;
}

/**
 * Calculate luminance for WCAG contrast ratio
 */
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const [rNorm, gNorm, bNorm] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Select product colors that contrast well with the design colors
 */
function getContrastingColors(
  designProfile: ColorProfile,
  productColors: Array<{ id: string; hexValue: string; displayName: string }>,
  count: number = 3
): string[] {
  if (!designProfile.colors.length || !productColors.length) {
    return productColors.slice(0, count).map(c => c.id);
  }

  // Calculate contrast scores for each product color
  const colorScores = productColors.map(productColor => {
    // Calculate minimum distance to any design color (we want maximum of this)
    const minDistanceToDesign = Math.min(
      ...designProfile.colors.map(designColor =>
        calculateColorDistance(designColor, productColor.hexValue)
      )
    );

    // Also calculate contrast ratio with dominant color
    const contrastRatio = getContrastRatio(designProfile.dominantColor, productColor.hexValue);

    // Combine distance and contrast ratio for final score
    // Higher scores are better (more contrast)
    const score = minDistanceToDesign * 0.7 + (contrastRatio - 1) * 10;

    return {
      ...productColor,
      contrastScore: score,
      minDistanceToDesign,
      contrastRatio
    };
  });

  // Sort by contrast score (descending) and return top colors
  return colorScores
    .sort((a, b) => b.contrastScore - a.contrastScore)
    .slice(0, count)
    .map(c => c.id);
}

/**
 * Get the best contrasting color for a design (single color selection)
 */
function getBestContrastingColor(
  designProfile: ColorProfile,
  productColors: Array<{ id: string; hexValue: string; displayName: string }>
): string | null {
  const selected = getContrastingColors(designProfile, productColors, 1);
  return selected[0] || null;
}

export {
  calculateColorDistance,
  isGoodContrast,
  getContrastRatio,
  getContrastingColors,
  getBestContrastingColor,
  hexToRgb,
  rgbToLab
};