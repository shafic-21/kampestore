"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { EditorToolbar } from "./editor-toolbar";
import { EditorColorSwitcher } from "./editor-color-switcher";
import { EditorStage } from "./editor-stage";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useProductDesignStore } from "../../store";

const ProductEditor = () => {
  // ===== URL STATE =====
  const [currentViewCode] = useQueryState(
    "view",
    parseAsStringLiteral(["front", "back"]).withDefault("front"),
  );

  const [editorMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["design", "preview"]).withDefault("design"),
  );

  const router = useRouter();

  // ===== STORE SELECTORS =====
  const {
    currentBaseSkuId,
    currentDesign,
    stageSize,
    selectedColors,
    generatedPreviews,
    currentProductColorId,
  } = useProductDesignStore(
    useShallow((state) => ({
      currentBaseSkuId: state.editor.currentBaseSkuId,
      currentDesign: state.editor.currentDesign,
      stageSize: state.editor.stageSize,
      selectedColors: state.editor.selectedColors,
      currentProductColorId: state.editor.currentProductColorId,
      generatedPreviews: state.editor.previews,
    })),
  );

  // Get cached product data
  const base = useProductDesignStore(
    (state) => state.bases.catalog[currentBaseSkuId || ""],
  );

  // ===== STORE ACTIONS =====
  const setStageSize = useProductDesignStore((state) => state.setStageSize);
  const uploadDesign = useProductDesignStore((state) => state.uploadDesign);
  const createListing = useProductDesignStore((state) => state.createListing);

  // ===== REFS =====
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== RESPONSIVE STAGE SIZING =====
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateStageSize = () => {
      const { width: containerW } = el.getBoundingClientRect();

      let squareSize: number;
      if (containerW < 640) {
        squareSize = Math.min(containerW - 20, 380);
      } else if (containerW < 1024) {
        squareSize = Math.min(containerW - 40, 600);
      } else if (containerW < 1440) {
        squareSize = Math.min(containerW - 60, 700);
      } else {
        squareSize = Math.min(containerW - 80, 900);
      }

      setStageSize({
        width: Math.floor(squareSize),
        height: Math.floor(squareSize),
      });
    };

    updateStageSize();
    const ro = new ResizeObserver(updateStageSize);
    ro.observe(el);
    window.addEventListener("resize", updateStageSize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateStageSize);
    };
  }, [setStageSize]);

  // ===== EVENT HANDLERS =====
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        if (file) alert("Please select an image file");
        return;
      }

      try {
        await uploadDesign(file);
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload design. Please try again.");
      }

      if (e.target) e.target.value = "";
    },
    [uploadDesign],
  );

  const handleContinue = useCallback(() => {
    if (!currentDesign || !selectedColors.length) {
      alert("Please upload a design and select at least one color");
      return;
    }

    const listingId = createListing();

    router.push(`/product-design/listing/${listingId}`);
  }, [currentDesign, selectedColors, createListing]);

  // ===== PREVIEW MODE LOGIC =====
  const previewImage =
    generatedPreviews[`${currentViewCode}_${currentProductColorId}`];

  // ===== LOADING STATE =====
  if (!base) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading editor...</div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="w-full h-full bg-[#F6F6F9] relative overflow-hidden flex flex-col gap-4 px-4 py-4">
      <div className="w-full flex justify-between">
        <EditorToolbar
          handleDesignUpload={() => fileInputRef.current?.click()}
        />
        <Button size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="sr-only hidden"
      />

      <div className="w-full flex flex-nowrap gap-8 items-start flex-1 min-h-0">
        <div
          ref={containerRef}
          className="flex-1 grid place-items-center min-h-0
                     h-[min(80svh,calc(100svh-10rem))] w-full p-0 overflow-hidden"
        >
          {editorMode === "preview" && (
            // Preview Mode: Show cached preview
            <div
              className="relative"
              style={{ width: stageSize.width, height: stageSize.height }}
            >
              <img
                src={previewImage}
                alt="Product preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {editorMode === "design" && (
            <EditorStage
              currentViewCode={currentViewCode}
              isDesignMode={editorMode === "design"}
            />
          )}
        </div>

        <EditorColorSwitcher />
      </div>
    </div>
  );
};

export default ProductEditor;
