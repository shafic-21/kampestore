import sharp from "sharp";
import type { ColorProfile } from "../types/store.types";
import type {
  BulkMockupOptions,
  MockupGenerationOptions,
  MockupResult,
} from "../types/mockup.types";

export class MockupGenerator {
  /**
   * Extract color profile and dimensions from design buffer.
   * PUBLIC method - called during design upload only.
   */
  static async extractColorProfileAndSize(designBuffer: Buffer): Promise<{
    colorProfile: ColorProfile;
    width: number;
    height: number;
  }> {
    try {
      const image = sharp(designBuffer);

      // Get image dimensions
      const metadata = await image.metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error("Unable to determine image dimensions");
      }

      // Get raw pixel data for color analysis
      const { data } = await image
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

      // Sample ~1000 pixels for performance
      const colorMap = new Map<string, number>();
      const step = Math.max(1, Math.floor(data.length / (4 * 1000)));

      for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Quantize colors to reduce noise (group similar shades)
        const qR = Math.round(r / 32) * 32;
        const qG = Math.round(g / 32) * 32;
        const qB = Math.round(b / 32) * 32;

        const color = `rgb(${qR},${qG},${qB})`;
        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }

      // Get top 5 most frequent colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);

      const dominantColor = sortedColors[0] || "rgb(0,0,0)";

      // Classify color profile for auto-suggestions
      const [r, g, b] = dominantColor.match(/\d+/g)!.map(Number);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);

      let profile: ColorProfile["profile"];
      if (brightness < 85) profile = "dark";
      else if (brightness > 170) profile = "light";
      else if (saturation > 50) profile = "vibrant";
      else profile = "muted";

      return {
        colorProfile: { colors: sortedColors, dominantColor, profile },
        width,
        height,
      };
    } catch (error) {
      console.warn("Color extraction failed:", error);
      return {
        colorProfile: {
          colors: ["rgb(0,0,0)"],
          dominantColor: "rgb(0,0,0)",
          profile: "dark",
        },
        width: 100,
        height: 100,
      };
    }
  }

  /**
   * Generate single mockup from design and template.
   * PRIVATE method - used internally for both single and bulk generation.
   */
  private static async generateSingleMockup(
    options: MockupGenerationOptions,
  ): Promise<MockupResult> {
    const {
      designBuffer,
      templateBuffer,
      backgroundColor,
      templateSize,
      printArea,
      placement,
      outputFormat = "png",
      quality = 90,
    } = options;

    // Create background layer
    const background = await sharp({
      create: {
        width: templateSize.width,
        height: templateSize.height,
        channels: 4,
        background: backgroundColor,
      },
    })
      .png()
      .toBuffer();

    // Calculate design position within print area
    // NormalizedPlacement uses absolute coordinates within the print area
    const designX = printArea.x_px + placement.left;
    const designY = printArea.y_px + placement.top;
    const designWidth = placement.width;
    const designHeight = placement.height;

    // Validate design stays within print area bounds
    const exceedsBounds =
      designX < printArea.x_px ||
      designY < printArea.y_px ||
      designX + designWidth > printArea.x_px + printArea.width_px ||
      designY + designHeight > printArea.y_px + printArea.height_px;

    if (exceedsBounds) {
      console.warn("Design extends beyond print area, will be clipped");
    }

    // Create transparent canvas for design
    const transparentCanvas = await sharp({
      create: {
        width: designWidth,
        height: designHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    // Get design metadata for aspect ratio calculations
    const designMeta = await sharp(designBuffer).metadata();
    const aspectRatio = designMeta.width! / designMeta.height!;
    const targetAspectRatio = designWidth / designHeight;

    let scaledWidth: number, scaledHeight: number;
    let offsetX = 0,
      offsetY = 0;

    // Maintain aspect ratio (contain mode - no stretching)
    if (aspectRatio > targetAspectRatio) {
      // Design is wider - fit to width, center vertically
      scaledWidth = designWidth;
      scaledHeight = Math.round(designWidth / aspectRatio);
      offsetY = Math.round((designHeight - scaledHeight) / 2);
    } else {
      // Design is taller - fit to height, center horizontally
      scaledHeight = designHeight;
      scaledWidth = Math.round(designHeight * aspectRatio);
      offsetX = Math.round((designWidth - scaledWidth) / 2);
    }

    // Resize design with high-quality resampling
    const scaledDesign = await sharp(designBuffer)
      .resize(scaledWidth, scaledHeight, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3, // High-quality resampling
      })
      .toBuffer();

    // Composite design onto transparent canvas
    const compositeDesign = await sharp(transparentCanvas)
      .composite([
        {
          input: scaledDesign,
          left: offsetX,
          top: offsetY,
        },
      ])
      .png()
      .toBuffer();

    // Apply rotation if needed
    let finalDesign = compositeDesign;
    if (placement.rotation !== 0) {
      finalDesign = await sharp(compositeDesign)
        .rotate(placement.rotation, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();
    }

    // Create clipping mask for print area if design exceeds bounds
    let finalComposite: Buffer;

    if (exceedsBounds) {
      // Create print area mask
      const mask = await sharp({
        create: {
          width: templateSize.width,
          height: templateSize.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${printArea.width_px}" height="${printArea.height_px}">
                <rect width="${printArea.width_px}" height="${printArea.height_px}" fill="white"/>
              </svg>`,
            ),
            left: printArea.x_px,
            top: printArea.y_px,
          },
        ])
        .png()
        .toBuffer();

      // Apply design with clipping
      const maskedDesign = await sharp(background)
        .composite([
          {
            input: finalDesign,
            left: Math.round(designX),
            top: Math.round(designY),
            blend: "over",
          },
        ])
        .composite([
          {
            input: mask,
            blend: "dest-in",
          },
        ])
        .toBuffer();

      // Final composite with template
      finalComposite = await sharp(background)
        .composite([
          {
            input: maskedDesign,
            blend: "over",
          },
          {
            input: templateBuffer,
            left: 0,
            top: 0,
            blend: "over",
          },
        ])
        [outputFormat]({ quality })
        .toBuffer();
    } else {
      // Standard compositing without clipping
      finalComposite = await sharp(background)
        .composite([
          {
            input: finalDesign,
            left: Math.round(designX),
            top: Math.round(designY),
            blend: "over",
          },
          {
            input: templateBuffer,
            left: 0,
            top: 0,
            blend: "over",
          },
        ])
        [outputFormat]({ quality })
        .toBuffer();
    }

    const metadata = await sharp(finalComposite).metadata();

    return {
      mockupBuffer: finalComposite,
      metadata: {
        width: metadata.width!,
        height: metadata.height!,
        size: finalComposite.length,
      },
    };
  }

  /**
   * Generate single mockup.
   * PUBLIC method for single mockup generation.
   */
  static async generateMockup(
    options: MockupGenerationOptions,
  ): Promise<MockupResult> {
    return this.generateSingleMockup(options);
  }

  /**
   * Generate multiple mockups with progress tracking.
   * PUBLIC method for bulk mockup generation with Teespring-style progressive updates.
   */
  static async generateBulkMockups(
    options: BulkMockupOptions,
  ): Promise<Array<{ id: string; result: MockupResult }>> {
    const { designBuffer, placement, variants, onProgress } = options;
    const results: Array<{ id: string; result: MockupResult }> = [];

    let completed = 0;
    const total = variants.length;

    // Process in chunks for optimal performance and memory usage
    const chunkSize = 3;
    for (let i = 0; i < variants.length; i += chunkSize) {
      const chunk = variants.slice(i, i + chunkSize);

      // Process chunk in parallel
      await Promise.all(
        chunk.map(async (variant) => {
          try {
            const result = await this.generateSingleMockup({
              designBuffer,
              templateBuffer: variant.templateBuffer,
              backgroundColor: variant.backgroundColor,
              templateSize: variant.templateSize,
              printArea: variant.printArea,
              placement,
            });

            results.push({ id: variant.id, result });
            completed++;

            // Report progress for UI updates (Teespring-style)
            onProgress?.(completed, total, variant.id);
          } catch (error) {
            console.error(
              `Failed to generate mockup for variant ${variant.id}:`,
              error,
            );
            completed++;
            onProgress?.(completed, total, variant.id);
          }
        }),
      );

      // Yield to event loop between chunks to prevent blocking
      if (i + chunkSize < variants.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return results;
  }
}
