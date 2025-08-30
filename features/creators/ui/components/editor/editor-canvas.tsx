"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image,
  Transformer,
  Text,
  Group,
} from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import type { EditorData } from "@/features/creators/types/editor.types";
import { getPublicUrl } from "@/lib/r2";

interface ProductEditorProps {
  editorData: EditorData;
}

interface DesignAttrs {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ editorData }) => {
  // Get available views and determine if we have front/back
  const frontView = editorData.views.find(v => v.code === "front");
  const backView = editorData.views.find(v => v.code === "back");
  
  // State management
  const [currentViewId, setCurrentViewId] = useState<string>(
    frontView?.id || editorData.views[0]?.id || ""
  );
  const [mode, setMode] = useState<"design" | "preview">("design");

  // Store designs per view
  const [designsByView, setDesignsByView] = useState<Record<string, {
    image: HTMLImageElement | null;
    attrs: DesignAttrs;
    isSelected: boolean;
    printQuality: "Good" | "Fair" | "Poor";
  }>>(() => {
    const initialDesigns: Record<string, any> = {};
    editorData.views.forEach(view => {
      initialDesigns[view.id] = {
        image: null,
        attrs: {
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        isSelected: false,
        printQuality: "Good",
      };
    });
    return initialDesigns;
  });

  const [stageSize, setStageSize] = useState({ width: 600, height: 600 });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const designRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layerRef = useRef<Konva.Layer>(null);

  // Get current view data
  const currentView = editorData.views.find(v => v.id === currentViewId);
  const mockupUrl = currentView?.mockupR2Key ? getPublicUrl(currentView.mockupR2Key) : "";
  
  // Load mockup image using use-image hook
  const [mockupImage] = useImage(mockupUrl);

  // Get current design based on selected view
  const currentDesign = designsByView[currentViewId] || {
    image: null,
    attrs: { x: 0, y: 0, width: 200, height: 200, rotation: 0, scaleX: 1, scaleY: 1 },
    isSelected: false,
    printQuality: "Good",
  };
  
  const setCurrentDesign = (updater: any) => {
    setDesignsByView((prev: typeof designsByView) => ({
      ...prev,
      [currentViewId]: typeof updater === 'function' 
        ? updater(prev[currentViewId])
        : updater
    }));
  };

  // Debug logging
  useEffect(() => {
    console.log("Editor state:", {
      mockupImage: !!mockupImage,
      currentViewId,
      currentView: currentView?.code,
      currentDesignImage: !!currentDesign.image,
      printArea: currentView?.printArea,
    });
  }, [mockupImage, currentViewId, currentView, currentDesign.image]);

  // Get current print area from database
  const currentPrintArea = currentView?.printArea;

  // Calculate print area dimensions relative to stage
  const calculatePrintArea = () => {
    if (!currentPrintArea || !currentView) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Scale from source image dimensions to stage dimensions
    const scale = stageSize.width / currentView.sourceWidthPx;

    return {
      x: currentPrintArea.xPx * scale,
      y: currentPrintArea.yPx * scale,
      width: currentPrintArea.widthPx * scale,
      height: currentPrintArea.heightPx * scale,
    };
  };

  const printAreaBounds = calculatePrintArea();

  // Calculate print quality based on DPI (resolution vs physical print size)
  useEffect(() => {
    if (
      currentDesign.image &&
      currentDesign.attrs.width &&
      currentDesign.attrs.height &&
      currentPrintArea &&
      currentView
    ) {
      // Calculate the scale factor from stage pixels to real-world pixels
      const stageToRealScale = currentView.sourceWidthPx / stageSize.width;

      // Convert design dimensions from stage pixels to real image pixels
      const realDesignWidthPx = currentDesign.attrs.width * stageToRealScale;
      const realDesignHeightPx = currentDesign.attrs.height * stageToRealScale;

      // Calculate physical dimensions in inches using print area's DPI
      const physicalWidthInches = realDesignWidthPx / currentPrintArea.dpi;
      const physicalHeightInches = realDesignHeightPx / currentPrintArea.dpi;

      // Get original image dimensions (handle both raster and SVG)
      const originalWidth =
        currentDesign.image.naturalWidth || currentDesign.image.width || 100;
      const originalHeight =
        currentDesign.image.naturalHeight || currentDesign.image.height || 100;

      // Calculate DPI based on original image resolution vs physical print size
      const dpiX = originalWidth / physicalWidthInches;
      const dpiY = originalHeight / physicalHeightInches;
      const averageDPI = (dpiX + dpiY) / 2;

      // Updated DPI quality thresholds (user-friendly for print-on-demand)
      // Based on real-world usage: 100+ DPI is good, 50+ DPI is acceptable
      const newQuality =
        averageDPI >= 100 ? "Good" : averageDPI >= 50 ? "Fair" : "Poor";

      // Update the quality for the current side
      setCurrentDesign((prev) => ({
        ...prev,
        printQuality: newQuality,
      }));

      // Debug logging with more detail
      console.log("Print Quality Analysis:", {
        stageSize: { width: stageSize.width, height: stageSize.height },
        designAttrsSize: {
          width: currentDesign.attrs.width,
          height: currentDesign.attrs.height,
        },
        stageToRealScale: stageToRealScale.toFixed(3),
        realDesignSize: {
          width: realDesignWidthPx.toFixed(0),
          height: realDesignHeightPx.toFixed(0),
        },
        originalImageSize: { width: originalWidth, height: originalHeight },
        physicalPrintSize: {
          width: physicalWidthInches.toFixed(2),
          height: physicalHeightInches.toFixed(2),
        },
        dpi: {
          x: dpiX.toFixed(0),
          y: dpiY.toFixed(0),
          average: averageDPI.toFixed(0),
        },
        quality:
          averageDPI >= 100 ? "Good" : averageDPI >= 50 ? "Fair" : "Poor",
      });
    }
  }, [
    currentDesign.attrs.width,
    currentDesign.attrs.height,
    currentDesign.image,
    currentPrintArea,
    currentView,
    stageSize.width,
    currentViewId,
  ]);

  // Handle responsive stage sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth, 600);
        const height = width;
        setStageSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (
      currentDesign.isSelected &&
      transformerRef.current &&
      designRef.current
    ) {
      transformerRef.current.nodes([designRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [currentDesign.isSelected]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          // Calculate initial size maintaining aspect ratio
          const originalWidth = img.naturalWidth || img.width || 200;
          const originalHeight = img.naturalHeight || img.height || 200;
          const aspectRatio = originalWidth / originalHeight;

          // Set initial size (200px base, maintaining aspect ratio)
          const baseSize = 200;
          let designWidth, designHeight;

          if (aspectRatio >= 1) {
            // Landscape or square
            designWidth = baseSize;
            designHeight = baseSize / aspectRatio;
          } else {
            // Portrait
            designWidth = baseSize * aspectRatio;
            designHeight = baseSize;
          }

          const centerX =
            printAreaBounds.x + (printAreaBounds.width - designWidth) / 2;
          const centerY =
            printAreaBounds.y + (printAreaBounds.height - designHeight) / 2;

          // Update the design for the current side only
          setCurrentDesign({
            image: img,
            attrs: {
              x: centerX,
              y: centerY,
              width: designWidth,
              height: designHeight,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
            },
            isSelected: true,
            printQuality: "Good", // Will be recalculated by useEffect
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle stage click for deselecting
  const handleStageClick = (e: any) => {
    if (mode === "preview") return;

    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setCurrentDesign((prev: typeof currentDesign) => ({ ...prev, isSelected: false }));
    }
  };

  // Handle drag end - NO CONSTRAINTS, allow creative freedom
  const handleDragEnd = (e: any) => {
    setCurrentDesign((prev) => ({
      ...prev,
      attrs: {
        ...prev.attrs,
        x: e.target.x(),
        y: e.target.y(),
      },
    }));
  };

  // Handle transform end - maintain aspect ratio
  const handleTransformEnd = (e: any) => {
    const node = designRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Use the average scale to maintain aspect ratio (Konva's keepRatio should handle this)
    const scale = (scaleX + scaleY) / 2;

    node.scaleX(1);
    node.scaleY(1);

    setCurrentDesign((prev) => ({
      ...prev,
      attrs: {
        x: node.x(),
        y: node.y(),
        width: Math.max(10, node.width() * scale), // Maintain aspect ratio
        height: Math.max(10, node.height() * scale), // Maintain aspect ratio
        rotation: node.rotation(),
        scaleX: 1,
        scaleY: 1,
      },
    }));
  };

  // Handle delete design
  const handleDeleteDesign = () => {
    setCurrentDesign({
      image: null,
      attrs: {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      isSelected: false,
      printQuality: "Good",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Calculate actual print dimensions in inches
  const getActualDimensions = () => {
    if (!currentDesign.attrs || !currentPrintArea || !currentView)
      return { width: "0", height: "0" };

    const scale = stageSize.width / currentView.sourceWidthPx;
    const dpi = currentPrintArea.dpi;

    const widthInches = currentDesign.attrs.width / scale / dpi;
    const heightInches = currentDesign.attrs.height / scale / dpi;

    return {
      width: widthInches.toFixed(2),
      height: heightInches.toFixed(2),
    };
  };

  const dimensions = getActualDimensions();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Quality Warning Banner */}
      {currentDesign.image && currentDesign.printQuality === "Poor" && (
        <div className="mb-4 bg-red-600 text-white px-4 py-2 rounded-lg text-center font-medium">
          Higher resolution artwork required
        </div>
      )}

      {/* Header Controls */}
      <div className="mb-6">
        {/* View Toggle */}
        <div className="flex justify-center gap-1 mb-4">
          {editorData.views.map((view) => (
            <button
              key={view.id}
              onClick={() => setCurrentViewId(view.id)}
              className={`px-6 py-2 font-medium transition-colors ${
                currentViewId === view.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {view.displayName}
            </button>
          ))}
        </div>

        {/* Upload Design */}
        <div className="text-center mb-4">
          <label className="text-sm text-gray-600 block mb-2">
            Upload Design
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <span className="mr-2">Choose File</span>
            <span className="text-gray-400">
              {currentDesign.image ? "Change Design" : "No file chosen"}
            </span>
          </label>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="mx-auto bg-gray-100 rounded-lg shadow-lg overflow-hidden relative"
        style={{ width: "100%", maxWidth: "600px", minHeight: "600px" }}
      >
        {/* Loading indicator */}
        {!mockupImage && currentView?.mockupR2Key && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading product image...</p>
            </div>
          </div>
        )}
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleStageClick}
          onTouchStart={handleStageClick}
        >
          <Layer ref={layerRef}>
            {/* Base Product Image or Fallback */}
            {mockupImage ? (
              <Image
                image={mockupImage}
                width={stageSize.width}
                height={stageSize.height}
                listening={false}
              />
            ) : (
              /* Fallback background when image is loading or not available */
              <Rect
                width={stageSize.width}
                height={stageSize.height}
                fill="#e5e7eb"
                stroke="#d1d5db"
                strokeWidth={2}
                listening={false}
              />
            )}

            {/* Design Image - Always show with print area clipping */}
            {currentDesign.image && (
              <Group
                clipFunc={(ctx) => {
                  ctx.rect(
                    printAreaBounds.x,
                    printAreaBounds.y,
                    printAreaBounds.width,
                    printAreaBounds.height
                  );
                }}
              >
                <Image
                  ref={designRef}
                  image={currentDesign.image}
                  x={currentDesign.attrs.x}
                  y={currentDesign.attrs.y}
                  width={currentDesign.attrs.width}
                  height={currentDesign.attrs.height}
                  rotation={currentDesign.attrs.rotation}
                  scaleX={currentDesign.attrs.scaleX}
                  scaleY={currentDesign.attrs.scaleY}
                  draggable={mode === "design"}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                  onClick={() =>
                    mode === "design" &&
                    setCurrentDesign((prev: typeof currentDesign) => ({
                      ...prev,
                      isSelected: true,
                    }))
                  }
                  onTap={() =>
                    mode === "design" &&
                    setCurrentDesign((prev: typeof currentDesign) => ({
                      ...prev,
                      isSelected: true,
                    }))
                  }
                />
              </Group>
            )}

            {/* Print Area - Only show in design mode */}
            {mode === "design" && currentPrintArea && (
              <>
                <Rect
                  x={printAreaBounds.x}
                  y={printAreaBounds.y}
                  width={printAreaBounds.width}
                  height={printAreaBounds.height}
                  fill="rgba(219, 234, 254, 0.2)"
                  stroke="rgba(147, 51, 234, 0.4)"
                  strokeWidth={1}
                  dash={[5, 5]}
                  listening={false}
                />
                {!currentDesign.image && (
                  <Text
                    x={printAreaBounds.x + printAreaBounds.width / 2}
                    y={printAreaBounds.y + printAreaBounds.height / 2 - 10}
                    text="Printable Area"
                    fontSize={14}
                    fill="rgba(147, 51, 234, 0.5)"
                    align="center"
                    offsetX={45}
                  />
                )}
              </>
            )}

            {/* Transformer - Only show in design mode when selected */}
            {mode === "design" &&
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
                  rotateEnabled={true}
                  keepRatio={true}
                  enabledAnchors={[
                    "bottom-right", // Only one corner for proportional scaling
                  ]}
                />
              )}
          </Layer>
        </Stage>

        {/* Dimensions and Quality Overlay - Show when design is selected */}
        {mode === "design" &&
          currentDesign.image &&
          currentDesign.isSelected && (
            <div className="absolute bottom-4 left-4 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm">
              <div className="flex items-center gap-3">
                <span>
                  {dimensions.width}" × {dimensions.height}"
                </span>
                <span className="border-l border-gray-600 pl-3">
                  Print Quality:
                  <span
                    className={`ml-2 font-medium ${
                      currentDesign.printQuality === "Good"
                        ? "text-green-400"
                        : currentDesign.printQuality === "Fair"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {currentDesign.printQuality}
                  </span>
                  {currentDesign.printQuality === "Poor" && (
                    <span className="ml-2 text-xs text-red-300">
                      (Low Resolution)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

        {/* Action Buttons Overlay */}
        {mode === "design" &&
          currentDesign.image &&
          currentDesign.isSelected && (
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleDeleteDesign}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                title="Delete Design"
              >
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                title="Edit Image"
              >
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          )}
      </div>

      {/* Preview/Design Toggle */}
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => {
            setMode("preview");
            setCurrentDesign((prev: typeof currentDesign) => ({ ...prev, isSelected: false }));
          }}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
            mode === "preview"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Preview
        </button>
        <button
          onClick={() => setMode("design")}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
            mode === "design"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Design
        </button>
      </div>
    </div>
  );
};

export { ProductEditor };
