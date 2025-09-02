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
  const { editorData, currentViewId, designsByView, stageSize, imageStore } =
    useEditorStore(
      useShallow((state) => ({
        editorData: state.editorData,
        currentViewId: state.currentViewId,
        designsByView: state.designsByView,
        stageSize: state.stageSize,
        imageStore: state.imageStore,
      })),
    );

  // ===== COMPUTED VALUES WITH USEMEMO =====
  const currentView = useMemo(() => {
    if (!editorData || !currentViewId) return null;
    return editorData.views.find((v) => v.id === currentViewId) || null;
  }, [editorData, currentViewId]);

  const currentDesign = useMemo(() => {
    const designState =
      designsByView[currentViewId] || createDefaultDesignState();

    return {
      ...designState,
      image: designState.imageId
        ? imageStore.get(designState.imageId) || null
        : null,
    };
  }, [designsByView, currentViewId, imageStore]);

  // ===== MOCKUP POSITIONING - FILLS STAGE =====
  // Since stage size matches mockup size, mockup fills entire stage
  const sourceW = currentView?.sourceWidthPx ?? 0;
  const sourceH = currentView?.sourceHeightPx ?? 0;
  const rel = (abs: number, origin: number) => Math.round(abs - origin);

  // Stage size is calculated to match mockup size (scaled if needed)
  const fitScale = useMemo(() => {
    if (!sourceW || !sourceH || !stageSize.width) return 1;
    return stageSize.width / Math.min(sourceW, sourceH);
  }, [stageSize, sourceW, sourceH]);

  // Mockup fills entire stage (no centering needed)
  const mockupDimensions = useMemo(() => {
    return {
      x: 0,
      y: 0,
      width: stageSize.width,
      height: stageSize.height,
      scale: fitScale,
    };
  }, [fitScale, stageSize]);

  // ===== PRINT AREA BOUNDS - SCALED FROM SOURCE =====
  // Print area coordinates are scaled directly from source dimensions
  const printAreaBounds = useMemo(() => {
    const pa = currentView?.printArea;
    if (!pa) return { x: 0, y: 0, width: 0, height: 0 };

    const s = mockupDimensions.scale || 1;
    return {
      x: Math.round(pa.x_px * s),
      y: Math.round(pa.y_px * s),
      width: Math.round(pa.width_px * s),
      height: Math.round(pa.height_px * s),
    };
  }, [currentView, mockupDimensions]);

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
  const initializeEditor = useEditorStore((state) => state.initializeEditor);
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

  // ===== TEST DATA =====
  const testEditorData: EditorData = {
    baseSku: {
      id: "990e8400-e29b-41d4-a716-446655440001",
      code: "classic-crew-neck-tee",
      name: "Classic Crew Neck T-Shirt",
    },
    views: [
      {
        id: "991e8400-e29b-41d4-a716-446655440001",
        code: "front",
        displayName: "Front",
        order: 1,
        sourceWidthPx: 900, // Original mockup size
        sourceHeightPx: 900, // Original mockup size
        mockupImageUrl: `https://files.xapisoft.co/apparel/product_template_classic-crew-neck-tee_front.png`,
        printArea: {
          id: "pa-front-001",
          base_sku_id: "990e8400-e29b-41d4-a716-446655440001",
          view_id: "991e8400-e29b-41d4-a716-446655440001",
          x_px: 282, // Relative to 900x900 source image
          y_px: 227,
          width_px: 336,
          height_px: 447,
          source_width_px: 900,
          source_height_px: 900,
          dpi: 300,
        },
      },
      {
        id: "991e8400-e29b-41d4-a716-446655440002",
        code: "back",
        displayName: "Back",
        order: 2,
        sourceWidthPx: 900,
        sourceHeightPx: 900,
        mockupImageUrl:
          "https://files.xapisoft.co/apparel/product_template_classic-crew-neck-tee_back.png",
        printArea: {
          id: "pa-back-001",
          base_sku_id: "990e8400-e29b-41d4-a716-446655440001",
          view_id: "991e8400-e29b-41d4-a716-446655440002",
          x_px: 277,
          y_px: 160,
          width_px: 349,
          height_px: 465,
          source_width_px: 900,
          source_height_px: 900,
          dpi: 300,
        },
      },
    ],
    colors: [
      { id: "color-white-001", hexColor: "#FFFFFF", displayName: "White" },
      { id: "color-black-001", hexColor: "#000000", displayName: "Black" },
      { id: "color-navy-001", hexColor: "#1E3A8A", displayName: "Navy" },
    ],
  };

  // ===== INITIALIZATION =====
  if (!editorData) {
    initializeEditor(testEditorData);
  }

  // ===== SYNC URL STATE WITH STORE =====
  if (editorData) {
    const viewToSet = editorData.views.find((v) => v.code === editorView);
    if (viewToSet && viewToSet.id !== currentViewId) {
      setCurrentView(viewToSet.id);
    }
  }

  // ===== RESPONSIVE STAGE SIZING =====
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const maxSize = Math.min(sourceW, sourceH);
      const scale = Math.min(1, width / maxSize, height / maxSize);
      const stageSize = Math.floor(maxSize * scale);

      setStageSize({ width: stageSize, height: stageSize });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [sourceW, sourceH, setStageSize]);

  // ===== TRANSFORMER SYNC =====
  useEffect(() => {
    if (
      editorMode === "design" &&
      currentDesign.isSelected &&
      transformerRef.current &&
      designRef.current
    ) {
      transformerRef.current.nodes([designRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [currentDesign.isSelected, editorMode]);

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

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          uploadDesign(img, file);
          if (e.target) e.target.value = "";
        };
        img.onerror = () => alert("Failed to load image");
        img.src = event.target?.result as string;
      };
      reader.onerror = () => alert("Failed to read file");
      reader.readAsDataURL(file);
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
          currentDesign={currentDesign}
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
          className="flex-1 grid place-items-center h-full"
        >
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleStageClick}
            onTouchStart={handleStageClick}
          >
            <Layer>
              {/* Parent group at snapped origin; children use (0,0) space */}
              <Group x={0} y={0}>
                {editorMode === "preview" ? (
                  // PREVIEW: top→bottom = mockup overlay → design → mockup-sized background
                  <>
                    <Rect
                      x={0}
                      y={0}
                      width={stageSize.width}
                      height={stageSize.height}
                      fill="#000000"
                      listening={false}
                    />
                    {/* mockup overlay (top) */}
                    {currentDesign.image && (
                      <Group clip={printAreaBounds}>
                        <Image
                          ref={designRef}
                          image={currentDesign.image}
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
                        width={stageSize.width}
                        height={stageSize.height}
                        listening={false}
                      />
                    )}
                  </>
                ) : (
                  // DESIGN: top→bottom = design → mockup overlay → mockup-sized background
                  <>
                    {/* design (top, clipped & draggable) */}
                    <Rect
                      x={0}
                      y={0}
                      width={stageSize.width}
                      height={stageSize.height}
                      fill="#000000"
                      listening={false}
                    />
                    {/* mockup overlay (middle) — transparent PNG with shadows */}
                    {mockupImage && (
                      <Image
                        image={mockupImage}
                        x={0}
                        y={0}
                        width={stageSize.width}
                        height={stageSize.height}
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
                    {currentDesign.image && (
                      <Group clip={printAreaBounds}>
                        <Image
                          ref={designRef}
                          image={currentDesign.image}
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
                currentDesign.image &&
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
