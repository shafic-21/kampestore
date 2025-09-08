import type { NormalizedPlacement } from "./store.types";

interface MockupGenerationOptions {
  designBuffer: Buffer;
  templateBuffer: Buffer;
  backgroundColor: string;
  templateSize: { width: number; height: number };
  printArea: {
    x_px: number;
    y_px: number;
    width_px: number;
    height_px: number;
    dpi: number;
  };
  placement: NormalizedPlacement;
  outputFormat?: "png" | "webp";
  quality?: number;
}

interface MockupResult {
  mockupBuffer: Buffer;
  metadata: {
    width: number;
    height: number;
    size: number;
  };
}

interface BulkMockupOptions {
  designBuffer: Buffer;
  placement: NormalizedPlacement;
  variants: Array<{
    id: string;
    templateBuffer: Buffer;
    backgroundColor: string;
    templateSize: { width: number; height: number };
    printArea: {
      x_px: number;
      y_px: number;
      width_px: number;
      height_px: number;
      dpi: number;
    };
  }>;
  onProgress?: (completed: number, total: number, variantId: string) => void;
}

export type { BulkMockupOptions, MockupResult, MockupGenerationOptions };
