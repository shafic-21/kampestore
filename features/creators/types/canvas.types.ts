/**
 * Editor Types
 *
 * Central type definitions for the product editor.
 * These types are shared between components, stores, and utilities.
 */

/**
 * Represents a printable area on a product view.
 * Matches database schema: base_sku_print_areas table.
 * Note: DB uses snake_case for column names.
 */
export interface PrintArea {
  id: string; // Unique identifier for the print area
  base_sku_id: string; // Reference to base SKU
  view_id: string; // Reference to view (unique per view)
  x_px: number; // X position in pixels from top-left (snake_case from DB)
  y_px: number; // Y position in pixels from top-left (snake_case from DB)
  width_px: number; // Width of print area in pixels (snake_case from DB)
  height_px: number; // Height of print area in pixels (snake_case from DB)
  source_width_px: number; // Source image width for scaling (snake_case from DB)
  source_height_px: number; // Source image height for scaling (snake_case from DB)
  dpi: number; // Dots per inch for print quality calculations
}

/**
 * Represents a single view of a product (e.g., front, back, sleeve).
 * Each view has its own mockup image and print area.
 */
export interface EditorView {
  id: string; // Unique identifier
  code: string; // Machine-readable code (e.g., "front", "back")
  displayName: string; // Human-readable name for UI
  order: number; // Display order in UI
  sourceWidthPx: number; // Original mockup image width
  sourceHeightPx: number; // Original mockup image height
  mockupImageUrl: string; // URL to the product mockup image
  printArea: PrintArea; // Printable area definition
}

/**
 * Product color variant.
 * Defines available colors for the product.
 */
export interface ProductColor {
  id: string; // Unique identifier
  hexColor: string; // Hex color code (e.g., "#FFFFFF")
  displayName: string; // Human-readable color name
}

/**
 * Base product SKU information.
 * Represents the core product being customized.
 */
export interface BaseSku {
  id: string; // Unique identifier
  code: string; // Machine-readable product code
  name: string; // Product display name
}

/**
 * Complete editor data structure.
 * Contains all information needed to render the product editor.
 */
export interface EditorData {
  baseSku: BaseSku; // Base product information
  views: EditorView[]; // Available views (front, back, etc.)
  colors: ProductColor[]; // Available color options
}

/**
 * Design placement data.
 * Stores how a design is positioned on a product.
 */
export interface DesignPlacement {
  viewId: string; // Which view the design is on
  x: number; // X position relative to print area
  y: number; // Y position relative to print area
  width: number; // Design width
  height: number; // Design height
  rotation: number; // Rotation in degrees
}

/**
 * Mockup generation request.
 * Used when requesting mockup generation from backend.
 */
export interface MockupRequest {
  productId: string; // Product being designed
  designUrl: string; // URL to the design image
  placement: DesignPlacement; // How to place the design
  colorId?: string; // Optional color variant
  viewCode: string; // Which view to generate
}

/**
 * Print quality levels.
 * Based on DPI calculations for print-on-demand.
 */
export type PrintQuality = "Good" | "Fair" | "Poor";

/**
 * Editor mode types.
 * Controls the editor's interaction mode.
 */
export type EditorMode = "design" | "preview";

/**
 * View codes.
 * Standard view identifiers across products.
 */
export type ViewCode =
  | "front"
  | "back"
  | "left"
  | "right"
  | "pocket"
  | "sleeve";

/**
 * Canvas utilities configuration.
 * Settings for canvas rendering and interactions.
 */
export interface CanvasConfig {
  minZoom: number; // Minimum zoom level (e.g., 0.5)
  maxZoom: number; // Maximum zoom level (e.g., 3)
  snapToGrid: boolean; // Enable grid snapping
  gridSize: number; // Grid size in pixels
  showGuides: boolean; // Show alignment guides
  autoSave: boolean; // Auto-save designs
  autoSaveInterval: number; // Auto-save interval in ms
}

/**
 * Export format options.
 * Defines how designs are exported for printing.
 */
export interface ExportOptions {
  format: "png" | "jpg" | "pdf"; // Export file format
  dpi: number; // Export resolution
  colorSpace: "rgb" | "cmyk"; // Color space for export
  includeBleed: boolean; // Include print bleed
  bleedSize: number; // Bleed size in mm
}

/**
 * API response for product data.
 * Used when fetching product information from backend.
 */
export interface ProductDataResponse {
  success: boolean;
  data?: EditorData;
  error?: string;
  message?: string;
}

/**
 * Design upload response.
 * Returned after uploading a design to backend.
 */
export interface DesignUploadResponse {
  success: boolean;
  designId?: string;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Validation rules for designs.
 * Used to validate designs before saving/printing.
 */
export interface DesignValidation {
  minDpi: number; // Minimum acceptable DPI
  maxFileSize: number; // Maximum file size in bytes
  allowedFormats: string[]; // Allowed file formats
  minWidth: number; // Minimum design width in pixels
  minHeight: number; // Minimum design height in pixels
}

/**
 * User preferences for editor.
 * Stores user-specific editor settings.
 */
export interface EditorPreferences {
  defaultView: ViewCode; // Default view to show
  showGrid: boolean; // Show grid overlay
  snapToGrid: boolean; // Enable grid snapping
  units: "inches" | "cm"; // Measurement units
  theme: "light" | "dark"; // Editor theme
  autoSave: boolean; // Enable auto-save
}

/**
 * Analytics event for editor actions.
 * Used for tracking user interactions.
 */
export interface EditorAnalyticsEvent {
  action: string; // Action performed (e.g., "upload_design")
  category: string; // Event category (e.g., "editor")
  label?: string; // Optional label
  value?: number; // Optional numeric value
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Type guards for runtime type checking.
 * Useful for validating API responses.
 */
export const isEditorData = (data: any): data is EditorData => {
  return (
    data &&
    typeof data === "object" &&
    "baseSku" in data &&
    "views" in data &&
    Array.isArray(data.views) &&
    "colors" in data &&
    Array.isArray(data.colors)
  );
};

export const isPrintArea = (area: any): area is PrintArea => {
  return (
    area &&
    typeof area === "object" &&
    typeof area.xPx === "number" &&
    typeof area.yPx === "number" &&
    typeof area.widthPx === "number" &&
    typeof area.heightPx === "number" &&
    typeof area.dpi === "number"
  );
};
