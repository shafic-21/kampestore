"use client";

import dynamic from "next/dynamic";

import React, { useState, useRef, useEffect } from "react";
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
import type { EditorData } from "@/features/creators/types/editor.types";
import { getPublicUrl } from "@/lib/r2";
import { EditorToolbar } from "./editor-toolbar";
import { useQueryState } from "nuqs";

interface DesignAttrs {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

const ProductEditor = () => {
  const [editorView] = useQueryState("view");
  const [editorMode] = useQueryState("mode");

  // Static test data - hardcoded for testing
  const editorData = {
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
        sourceWidthPx: 900,
        sourceHeightPx: 900,
        mockupImageUrl: `https://files.xapisoft.co/apparel/product_template_classic-crew-neck-tee_front.png`,
        printArea: {
          id: "pa-front",
          xPx: 282,
          yPx: 227,
          widthPx: 336,
          heightPx: 447,
          sourceWidthPx: 900,
          sourceHeightPx: 900,
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
          id: "pa-back",
          xPx: 277,
          yPx: 160,
          widthPx: 349,
          heightPx: 465,
          sourceWidthPx: 900,
          sourceHeightPx: 900,
          dpi: 300,
        },
      },
    ],
    colors: [
      { id: "white", hexColor: "#FFFFFF", displayName: "White" },
      { id: "black", hexColor: "#000000", displayName: "Black" },
      { id: "navy", hexColor: "#1E3A8A", displayName: "Navy" },
    ],
  };

  console.log(editorData);

  // Get available views and determine if we have front/back
  const frontView = editorData.views.find((v) => v.code === "front");
  const backView = editorData.views.find((v) => v.code === "back");

  // State management
  const [currentViewId, setCurrentViewId] = useState<string>(
    frontView?.id || editorData.views[0]?.id || "",
  );

  // Store designs per view
  const [designsByView, setDesignsByView] = useState<
    Record<
      string,
      {
        image: HTMLImageElement | null;
        attrs: DesignAttrs;
        isSelected: boolean;
        printQuality: "Good" | "Fair" | "Poor";
      }
    >
  >(() => {
    const initialDesigns: Record<string, any> = {};
    editorData.views.forEach((view) => {
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
  const currentView = editorData.views.find((v) => v.id === currentViewId);
  const mockupUrl = currentView?.mockupImageUrl || null;

  // Load mockup image using use-image hook - only if URL exists
  const [mockupImage] = useImage(mockupUrl as string);

  // Get current design based on selected view
  const currentDesign = designsByView[currentViewId] || {
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

  const setCurrentDesign = (updater: any) => {
    setDesignsByView((prev: typeof designsByView) => ({
      ...prev,
      [currentViewId]:
        typeof updater === "function" ? updater(prev[currentViewId]) : updater,
    }));
  };

  // Debug logging
  useEffect(() => {
    console.log("Editor state:", {
      mockupImage: !!mockupImage,
      mockupUrl,
      currentViewId,
      currentView: currentView?.code,
      currentDesignImage: !!currentDesign.image,
      printArea: currentView?.printArea,
      mockupImageUrl: currentView?.mockupImageUrl,
    });
  }, [mockupImage, mockupUrl, currentViewId, currentView, currentDesign.image]);

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
    if (editorMode === "preview") return;

    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setCurrentDesign((prev: typeof currentDesign) => ({
        ...prev,
        isSelected: false,
      }));
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
    <div className="w-full mx-auto bg-[#F6F6F9] h-screen">
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
        className="mx-auto rounded-lg shadow-lg overflow-hidden relative border-red-500 border-2"
        style={{ width: "100%" }}
      >
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
              <>
                {/* Background */}
                <Rect
                  width={stageSize.width}
                  height={stageSize.height}
                  fill="#FFC4C4"
                  stroke="#d1d5db"
                  strokeWidth={2}
                  listening={false}
                />

                {/* User's Design - In Preview Mode: Between background and mockup */}
                {editorMode === "preview" && currentDesign.image && (
                  <Group
                    clipFunc={(ctx) => {
                      ctx.rect(
                        printAreaBounds.x,
                        printAreaBounds.y,
                        printAreaBounds.width,
                        printAreaBounds.height,
                      );
                    }}
                  >
                    <Image
                      image={currentDesign.image}
                      x={currentDesign.attrs.x}
                      y={currentDesign.attrs.y}
                      width={currentDesign.attrs.width}
                      height={currentDesign.attrs.height}
                      rotation={currentDesign.attrs.rotation}
                      scaleX={currentDesign.attrs.scaleX}
                      scaleY={currentDesign.attrs.scaleY}
                      globalCompositeOperation="multiply"
                      globalAlpha={0.5}
                      listening={false}
                    />
                  </Group>
                )}

                {/* Mockup Image */}
                <Image
                  image={mockupImage}
                  width={stageSize.width}
                  height={stageSize.height}
                  listening={false}
                />
              </>
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

            {/* Design Image - Only show in design mode (for editing) */}
            {editorMode === "design" && currentDesign.image && (
              <Group
                clipFunc={(ctx) => {
                  ctx.rect(
                    printAreaBounds.x,
                    printAreaBounds.y,
                    printAreaBounds.width,
                    printAreaBounds.height,
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
                  draggable={true}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                  onClick={() =>
                    setCurrentDesign((prev: typeof currentDesign) => ({
                      ...prev,
                      isSelected: true,
                    }))
                  }
                  onTap={() =>
                    setCurrentDesign((prev: typeof currentDesign) => ({
                      ...prev,
                      isSelected: true,
                    }))
                  }
                />
              </Group>
            )}

            {/* Print Area - Only show in design mode */}
            {editorMode === "design" && currentPrintArea && (
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
                  rotateEnabled={true}
                  keepRatio={true}
                  enabledAnchors={[
                    "bottom-right", // Only one corner for proportional scaling
                  ]}
                />
              )}
          </Layer>
        </Stage>

        <EditorToolbar />

        {/* Dimensions and Quality Overlay - Show when design is selected */}
        {editorMode === "design" &&
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
        {editorMode === "design" &&
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
    </div>
  );
};

export default ProductEditor;
