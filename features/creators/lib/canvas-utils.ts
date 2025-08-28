import Konva from "konva";
import type { DesignElement, EditorPrintArea } from "../types/editor.types";

/**
 * Generate a unique ID for design elements
 */
export function generateElementId(): string {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert print area coordinates to canvas coordinates
 * @param printArea - Print area data from database
 * @param canvasWidth - Current canvas width
 * @param canvasHeight - Current canvas height
 * @returns Scaled print area coordinates
 */
export function scalePrintAreaToCanvas(
  printArea: EditorPrintArea,
  canvasWidth: number,
  canvasHeight: number
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const scaleX = canvasWidth / printArea.sourceWidthPx;
  const scaleY = canvasHeight / printArea.sourceHeightPx;
  
  return {
    x: printArea.xPx * scaleX,
    y: printArea.yPx * scaleY,
    width: printArea.widthPx * scaleX,
    height: printArea.heightPx * scaleY,
  };
}

/**
 * Check if a point is within the print area (with buffer zone)
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param printArea - Print area bounds
 * @param bufferZone - Extra area outside print area where dragging is allowed
 * @returns Whether point is within allowed drag area
 */
export function isWithinDragBounds(
  x: number,
  y: number,
  printArea: { x: number; y: number; width: number; height: number },
  bufferZone: number = 50
): boolean {
  return (
    x >= printArea.x - bufferZone &&
    x <= printArea.x + printArea.width + bufferZone &&
    y >= printArea.y - bufferZone &&
    y <= printArea.y + printArea.height + bufferZone
  );
}

/**
 * Constrain element position to stay within drag bounds
 */
export function constrainToDragBounds(
  element: { x: number; y: number; width: number; height: number },
  printArea: { x: number; y: number; width: number; height: number },
  bufferZone: number = 50
): { x: number; y: number } {
  const minX = printArea.x - bufferZone;
  const maxX = printArea.x + printArea.width + bufferZone - element.width;
  const minY = printArea.y - bufferZone;
  const maxY = printArea.y + printArea.height + bufferZone - element.height;

  return {
    x: Math.max(minX, Math.min(maxX, element.x)),
    y: Math.max(minY, Math.min(maxY, element.y)),
  };
}

/**
 * Calculate bounds for clipping area (what's visible in print area)
 */
export function calculateClippingBounds(
  element: { x: number; y: number; width: number; height: number },
  printArea: { x: number; y: number; width: number; height: number }
): {
  clipX: number;
  clipY: number;
  clipWidth: number;
  clipHeight: number;
  visible: boolean;
} {
  const left = Math.max(element.x, printArea.x);
  const top = Math.max(element.y, printArea.y);
  const right = Math.min(element.x + element.width, printArea.x + printArea.width);
  const bottom = Math.min(element.y + element.height, printArea.y + printArea.height);

  const clipWidth = Math.max(0, right - left);
  const clipHeight = Math.max(0, bottom - top);

  return {
    clipX: left - element.x,
    clipY: top - element.y,
    clipWidth,
    clipHeight,
    visible: clipWidth > 0 && clipHeight > 0,
  };
}

/**
 * Load image and get its natural dimensions
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Create a new design element from uploaded image
 */
export async function createDesignElementFromImage(
  imageUrl: string,
  printArea: { x: number; y: number; width: number; height: number },
  maxInitialSize: number = 200
): Promise<DesignElement> {
  const img = await loadImage(imageUrl);
  
  // Calculate initial size (fit within maxInitialSize while maintaining aspect ratio)
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  let initialWidth = maxInitialSize;
  let initialHeight = maxInitialSize / aspectRatio;
  
  if (initialHeight > maxInitialSize) {
    initialHeight = maxInitialSize;
    initialWidth = maxInitialSize * aspectRatio;
  }
  
  // Position in center of print area
  const x = printArea.x + (printArea.width - initialWidth) / 2;
  const y = printArea.y + (printArea.height - initialHeight) / 2;
  
  return {
    id: generateElementId(),
    type: "image",
    x,
    y,
    width: initialWidth,
    height: initialHeight,
    rotation: 0,
    imageUrl,
    originalWidth: img.naturalWidth,
    originalHeight: img.naturalHeight,
    scaleX: 1,
    scaleY: 1,
  };
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Snap rotation to 15-degree increments
 */
export function snapRotation(rotation: number, snapIncrement: number = 15): number {
  const degrees = radToDeg(rotation);
  const snappedDegrees = Math.round(degrees / snapIncrement) * snapIncrement;
  return degToRad(snappedDegrees);
}

/**
 * Get corner positions for selection handles
 */
export function getSelectionHandles(element: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}): {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  rotateHandle: { x: number; y: number };
} {
  const cos = Math.cos(element.rotation);
  const sin = Math.sin(element.rotation);
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  
  // Calculate corner positions relative to center, then rotate and translate
  const corners = [
    { x: -element.width / 2, y: -element.height / 2 }, // top-left
    { x: element.width / 2, y: -element.height / 2 },  // top-right
    { x: -element.width / 2, y: element.height / 2 },  // bottom-left
    { x: element.width / 2, y: element.height / 2 },   // bottom-right
  ];
  
  const rotatedCorners = corners.map(corner => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));
  
  // Rotate handle position (above top-center)
  const rotateHandleDistance = 30;
  const rotateHandle = {
    x: centerX + 0 * cos - (-element.height / 2 - rotateHandleDistance) * sin,
    y: centerY + 0 * sin + (-element.height / 2 - rotateHandleDistance) * cos,
  };
  
  return {
    topLeft: rotatedCorners[0],
    topRight: rotatedCorners[1],
    bottomLeft: rotatedCorners[2],
    bottomRight: rotatedCorners[3],
    rotateHandle,
  };
}