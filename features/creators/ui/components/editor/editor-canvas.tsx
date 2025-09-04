"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useImage from "use-image";
import Konva from "konva";
import {
  Stage,
  Layer,
  Rect,
  Image,
  Transformer,
  Text,
  Group,
} from "react-konva";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import {
  createDefaultDesignState,
  useEditorStore,
} from "@/features/creators/store/editor-store";
import { EditorToolbar } from "./editor-toolbar";
import type { EditorData } from "@/features/creators/types/canvas.types";
import { useShallow } from "zustand/react/shallow";
import { EditorColorSwitcher } from "./editor-color-switcher";
import { Button } from "@/components/ui/button";

/**
 * ProductEditor Component - Full Viewport with Centered Mockup
 *
 * FIXED DESIGN PRINCIPLES:
 * - Full viewport canvas with centered mockup at original size (900x900px)
 * - Print area bounds correctly calculated for centered mockup position
 * - Proper layer ordering based on mode:
 *   * PREVIEW MODE: mockup → design → background (design below, clipped)
 *   * DESIGN MODE: design → mockup → background (design above for editing)
 * - Optimized clipping using 'clip' prop instead of 'clipFunc' for rectangles
 */
const ProductEditor = () => {
  // ===== URL STATE (nuqs) =====
  const [editorView, setEditorView] = useQueryState(
    "view",
    parseAsStringLiteral(["front", "back"]).withDefault("front"),
  );

  const [editorMode, setEditorMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["design", "preview"]).withDefault("design"),
  );

  // ===== ZUSTAND STORE - GRANULAR SELECTION =====
  const {
    editorData,
    currentViewId,
    designsByView,
    stageSize,
    fileStore,
    currentProductColorId,
  } = useEditorStore(
    useShallow((state) => ({
      editorData: state.editorData,
      currentViewId: state.currentViewId,
      designsByView: state.designsByView,
      stageSize: state.stageSize,
      fileStore: state.fileStore,
      currentProductColorId: state.currentProductColorId,
    })),
  );

  // ===== COMPUTED VALUES WITH USEMEMO =====
  const currentView = useMemo(() => {
    if (!editorData || !currentViewId) return null;
    return editorData.views.find((v) => v.id === currentViewId) || null;
  }, [editorData, currentViewId]);

  // State for the current design image
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);

  // Get current design state
  const currentDesign = useMemo(() => {
    const designState =
      designsByView[currentViewId] || createDefaultDesignState();
    return designState;
  }, [designsByView, currentViewId]);

  // Load image from file when design changes
  useEffect(() => {
    const loadImage = async () => {
      if (currentDesign.fileId) {
        const file = fileStore.get(currentDesign.fileId);
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => setDesignImage(img);
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        } else {
          setDesignImage(null);
        }
      } else {
        setDesignImage(null);
      }
    };
    loadImage();
  }, [currentDesign.fileId, fileStore]);

  // Get the current product color object for background rendering
  const currentProductColor = useMemo(() => {
    if (!editorData?.colors || !currentProductColorId) {
      return { hexColor: "#F5F5DC" }; // Default fallback color (beige)
    }
    return (
      editorData.colors.find((color) => color.id === currentProductColorId) || {
        hexColor: "#F5F5DC",
      }
    );
  }, [editorData?.colors, currentProductColorId]);

  // ===== MOCKUP POSITIONING - FILLS STAGE =====
  // Since stage size matches mockup size, mockup fills entire stage
  const sourceW = currentView?.sourceWidthPx ?? 0;
  const sourceH = currentView?.sourceHeightPx ?? 0;
  const rel = (abs: number, origin: number) => Math.round(abs - origin);

  // No longer need fitScale - Stage handles scaling with scaleX/scaleY
  // Keep all elements in source pixel space

  // ===== PRINT AREA BOUNDS - SOURCE SPACE =====
  // Print area coordinates stay in source pixels (Stage scale handles display)
  const printAreaBounds = useMemo(() => {
    const pa = currentView?.printArea;
    if (!pa) return { x: 0, y: 0, width: 0, height: 0 };
    return { x: pa.x_px, y: pa.y_px, width: pa.width_px, height: pa.height_px };
  }, [currentView]);

  // ===== DESIGN POSITIONING - RELATIVE TO STAGE =====
  // Since mockup is at (0,0), design positions are relative to stage origin
  const designRel = useMemo(() => {
    const a = currentDesign.attrs;
    return {
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      rotation: a.rotation,
    };
  }, [currentDesign.attrs]);

  // ===== STORE ACTIONS =====
  const setCurrentView = useEditorStore((state) => state.setCurrentView);
  const setStageSize = useEditorStore((state) => state.setStageSize);
  const uploadDesign = useEditorStore((state) => state.uploadDesign);
  const updateDesignAttributes = useEditorStore(
    (state) => state.updateDesignAttributes,
  );
  const setDesignSelection = useEditorStore(
    (state) => state.setDesignSelection,
  );

  // ===== REFS =====
  const containerRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== SYNC URL STATE WITH STORE =====
  if (editorData) {
    const viewToSet = editorData.views.find((v) => v.code === editorView);
    if (viewToSet && viewToSet.id !== currentViewId) {
      setCurrentView(viewToSet.id);
    }
  }

  // ===== RESPONSIVE SQUARE STAGE SIZING =====
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !sourceW || !sourceH) return;

    // Verify mockup is square (optional safety check)
    if (sourceW !== sourceH) {
      console.warn("Mockup is not square:", { sourceW, sourceH });
    }

    const updateStageSize = () => {
      const { width: containerW, height: containerH } =
        el.getBoundingClientRect();

      // Responsive square sizes based on container width
      let squareSize: number;

      if (containerW < 640) {
        // Mobile
        squareSize = Math.min(containerW - 20, 380);
      } else if (containerW < 1024) {
        // Tablet
        squareSize = Math.min(containerW - 40, 600);
      } else if (containerW < 1440) {
        // Laptop
        squareSize = Math.min(containerW - 60, 700);
      } else {
        // Desktop
        squareSize = Math.min(containerW - 80, 900);
      }

      // Ensure integer value to prevent sub-pixel rendering
      squareSize = Math.floor(squareSize);

      setStageSize({
        width: squareSize,
        height: squareSize,
      });
    };

    // Initial calculation
    updateStageSize();

    // Observe container changes
    const ro = new ResizeObserver(updateStageSize);
    ro.observe(el);

    // Also handle window resize
    window.addEventListener("resize", updateStageSize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateStageSize);
    };
  }, [sourceW, sourceH, setStageSize]);

  // ===== TRANSFORMER SYNC =====
  // Ensure the Transformer attaches when the image node becomes available (after async load)
  useEffect(() => {
    const transformer = transformerRef.current;
    const node = designRef.current;

    if (editorMode === "design" && currentDesign.isSelected && transformer && node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    } else if (transformer) {
      transformer.nodes([]);
    }
  }, [currentDesign.isSelected, editorMode, designImage, currentDesign.fileId]);

  // ===== LOAD MOCKUP IMAGE =====
  const mockupUrl = currentView?.mockupImageUrl || null;
  const [mockupImage] = useImage(mockupUrl as string);

  useEffect(() => {
    if (!mockupImage || !sourceW || !sourceH) return;
    const nw = (mockupImage as HTMLImageElement).naturalWidth || 0;
    const nh = (mockupImage as HTMLImageElement).naturalHeight || 0;
    if (!nw || !nh) return;

    const sameAspect = Math.abs(nw / nh - sourceW / sourceH) < 0.0001;
    const sameDims = nw === sourceW && nh === sourceH;

    if (!sameAspect) {
      // This would cause stretch if you forced width/height to DB dims.
      // We *don’t* force; we uniformly scale from DB space, so we’re safe visually,
      // but flag it so you can fix the asset/metadata mismatch.
      console.warn(
        "[ProductEditor] Asset aspect ratio differs from DB source dimensions:",
        { asset: { nw, nh }, db: { sourceW, sourceH } },
      );
    } else if (!sameDims) {
      // Aspect matches but pixel size differs (e.g., 1800 vs 900). Uniform scaling is still safe.
      console.info(
        "[ProductEditor] Asset pixel size differs from DB but aspect matches. OK to render uniformly.",
        { asset: { nw, nh }, db: { sourceW, sourceH } },
      );
    }
  }, [mockupImage, sourceW, sourceH]);

  // ===== EVENT HANDLERS =====
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        if (file) alert("Please select an image file");
        return;
      }

      // Just pass the file directly to uploadDesign
      uploadDesign(file);
      if (e.target) e.target.value = "";
    },
    [uploadDesign],
  );

  const handleStageClick = React.useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (editorMode === "preview") return;
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setDesignSelection(false);
      }
    },
    [editorMode, setDesignSelection],
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const nx = e.target.x();
      const ny = e.target.y();
      updateDesignAttributes({ x: nx, y: ny });
    },
    [updateDesignAttributes],
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = designRef.current;
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const scale = (scaleX + scaleY) / 2;

      node.scaleX(1);
      node.scaleY(1);

      updateDesignAttributes({
        x: node.x(),
        y: node.y(),
        width: Math.max(10, node.width() * scale),
        height: Math.max(10, node.height() * scale),
        rotation: node.rotation(),
        scaleX: 1,
        scaleY: 1,
      });
    },
    [updateDesignAttributes],
  );

  const handleDesignClick = React.useCallback(() => {
    setDesignSelection(true);
  }, [setDesignSelection]);

  // ===== EARLY RETURN FOR LOADING =====
  if (!editorData || !currentView) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading editor...</div>
      </div>
    );
  }
  // ===== MAIN RENDER WITH FIXED LAYER ORDERING =====
  return (
    <div className="w-full h-full bg-[#F6F6F9] relative overflow-hidden flex flex-col gap-4 px-4 py-4">
      <div className="w-full flex justify-between">
        <EditorToolbar
          handleDesignUpload={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          currentDesign={{
            ...currentDesign,
            image: designImage,
          }}
        />
        <Button size="lg">Publish</Button>
      </div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="sr-only hidden"
      />

      {/* Responsive Canvas Container */}
      <div className="w-full flex flex-nowrap gap-8 items-start flex-1 min-h-0">
        <div
          ref={containerRef}
          className="flex-1 grid place-items-center min-h-0
                     h-[min(80svh,calc(100svh-10rem))] w-full p-0 overflow-hidden"
        >
          <Stage
            // Source dimensions (should be square)
            width={sourceW}
            height={sourceH}
            // Uniform scale for square preservation
            scale={{
              x: stageSize.width / sourceW,
              y: stageSize.width / sourceW, // Use width for both to ensure square
            }}
            // CSS size matches the calculated square
            style={{
              width: `${stageSize.width}px`,
              height: `${stageSize.width}px`, // Force square
              // Prevent edge bleeding
              overflow: "hidden",
              // Ensure crisp rendering
              imageRendering: "pixelated",
              // Clean background
              backgroundColor: "transparent",
            }}
            onMouseDown={handleStageClick}
            onTouchStart={handleStageClick}
            // Optimize for retina displays
            pixelRatio={Math.min(window.devicePixelRatio || 1, 2)}
          >
            <Layer>
              {/* Parent group at snapped origin; children use (0,0) space */}
              <Group x={0} y={0}>
                {editorMode === "preview" ? (
                  // PREVIEW: top→bottom = mockup overlay → design → mockup-sized background
                  <>
                    <Rect
                      x={0} // No offset needed
                      y={0} // No offset needed
                      width={sourceW} // Exact width
                      height={sourceH} // Exact height
                      fill={currentProductColor.hexColor}
                      listening={false}
                    />
                    {/* mockup overlay (top) */}
                    {designImage && (
                      <Group clip={printAreaBounds}>
                        <Image
                          ref={designRef}
                          image={designImage}
                          x={designRel.x}
                          y={designRel.y}
                          width={designRel.width}
                          height={designRel.height}
                          rotation={designRel.rotation}
                          listening={false}
                        />
                      </Group>
                    )}
                    {mockupImage && (
                      <Image
                        image={mockupImage}
                        x={0}
                        y={0}
                        width={sourceW}
                        height={sourceH}
                        listening={false}
                      />
                    )}
                  </>
                ) : (
                  // DESIGN: top→bottom = design → mockup overlay → mockup-sized background
                  <>
                    {/* design (top, clipped & draggable) */}
                    <Rect
                      x={0} // No offset needed
                      y={0} // No offset needed
                      width={sourceW} // Exact width
                      height={sourceH} // Exact height
                      fill={currentProductColor.hexColor}
                      listening={false}
                    />
                    {/* mockup overlay (middle) — transparent PNG with shadows */}
                    {mockupImage && (
                      <Image
                        image={mockupImage}
                        x={0}
                        y={0}
                        width={sourceW}
                        height={sourceH}
                        listening={false}
                      />
                    )}
                    {editorMode === "design" && (
                      <Rect
                        x={printAreaBounds.x}
                        y={printAreaBounds.y}
                        width={printAreaBounds.width}
                        height={printAreaBounds.height}
                        fill="rgba(219,234,254,0.2)"
                        stroke="rgba(147,51,234,0.4)"
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                      />
                    )}
                    {designImage && (
                      <Group clip={printAreaBounds}>
                        <Image
                          ref={designRef}
                          image={designImage}
                          x={designRel.x}
                          y={designRel.y}
                          width={designRel.width}
                          height={designRel.height}
                          rotation={designRel.rotation}
                          draggable
                          onDragEnd={handleDragEnd}
                          onTransformEnd={handleTransformEnd}
                          onClick={handleDesignClick}
                          onTap={handleDesignClick}
                        />
                      </Group>
                    )}

                    {/* mockup-sized background (bottom) */}
                  </>
                )}

                {/* Print area guide (design mode only, relative to group) */}
              </Group>

              {/* Transformer on top in design mode */}
              {editorMode === "design" &&
                designImage &&
                currentDesign.isSelected && (
                  <Transformer
                    ref={transformerRef}
                    anchorSize={10}
                    anchorCornerRadius={2}
                    anchorFill="#3B82F6"
                    anchorStroke="#1E40AF"
                    anchorStrokeWidth={2}
                    borderStroke="#3B82F6"
                    borderStrokeWidth={2}
                    borderDash={[4, 4]}
                    rotateEnabled
                    keepRatio
                    enabledAnchors={["bottom-right"]}
                  />
                )}
            </Layer>
          </Stage>
        </div>

        <EditorColorSwitcher />
      </div>
    </div>
  );
};

export default ProductEditor;
