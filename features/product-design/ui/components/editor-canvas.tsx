"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import useImage from "use-image";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { usePreviewGenerator } from "../../hooks/use-preview-generator";
import { useProductDesignStore } from "../../store";
import { EditorColorSwitcher } from "./editor-color-switcher";
import { EditorStage } from "./editor-stage";
import { EditorToolbar } from "./editor-toolbar";

interface ProductEditorProps {
  initialSkuId: string;
  isEditMode: boolean;
}

const ProductEditor = ({ initialSkuId, isEditMode }: ProductEditorProps) => {
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
    currentDesign, // This line changes
    stageSize,
    selectedColors,
    generatedPreviews,
    currentProductColorId,
  } = useProductDesignStore(
    useShallow((state) => ({
      currentBaseSkuId: state.editor.currentBaseSkuId,
      currentDesign: state.editor.currentDesigns[currentViewCode], // Changed this line
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

  const currentView = base?.views?.[currentViewCode];

  const [templateEl, templateStatus] = useImage(
    currentView?.template?.url || "",
  );

  // ===== PREVIEW GENERATOR =====
  const { isGenerating, generationError } = usePreviewGenerator();

  // ===== STORE ACTIONS =====
  const setStageSize = useProductDesignStore((state) => state.setStageSize);
  const uploadDesign = useProductDesignStore((state) => state.uploadDesign);
  const createListing = useProductDesignStore((state) => state.createListing);
  const generateCatalogPreviews = useProductDesignStore(
    (state) => state.generateCatalogPreviews,
  );

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
        await uploadDesign(currentViewCode, file); // Added currentViewCode parameter
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload design. Please try again.");
      }

      if (e.target) e.target.value = "";
    },
    [uploadDesign, currentViewCode], // Added currentViewCode to dependencies
  );

  const listingId = useProductDesignStore((state) => state.listing.id);

  const handleContinue = useCallback(() => {
    if (!currentDesign || !selectedColors.length) {
      alert("Please upload a design and select at least one color");
      return;
    }

    if (!listingId && !isEditMode) {
      createListing();
    }

    generateCatalogPreviews().catch((error) => {
      console.error("Background preview generation failed:", error);
    });

    // Navigate with the appropriate SKU
    const targetSku = initialSkuId || currentBaseSkuId;
    router.push(`/product-design/listing/${targetSku}`);
  }, [
    currentDesign,
    selectedColors,
    createListing,
    generateCatalogPreviews,
    router,
    listingId,
    isEditMode,
    initialSkuId,
    currentBaseSkuId,
  ]);

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

  return (
    <div className="w-full h-full  relative overflow-hidden flex flex-col gap-4 px-4 py-4">
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

      <div className="w-full flex flex-nowrap gap-8 items-start flex-1 min-h-0 ">
        <div
          ref={containerRef}
          className="flex-1 grid place-items-center min-h-0
                     h-[min(80svh,calc(100svh-10rem))] w-full p-0 overflow-hidden"
        >
          {editorMode === "preview" && (
            // Preview Mode: Show cached preview
            <div
              className="relative flex items-center justify-center"
              style={{ width: stageSize.width, height: stageSize.height }}
            >
              {isGenerating && (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                  <p className="text-sm text-muted-foreground">
                    Generating preview...
                  </p>
                </div>
              )}

              {!isGenerating && generationError && (
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-sm text-destructive">
                    Failed to generate preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {generationError}
                  </p>
                </div>
              )}

              {!isGenerating && !generationError && previewImage && (
                <img
                  src={previewImage}
                  alt="Product preview"
                  className="w-full h-full object-contain"
                />
              )}

              {!isGenerating &&
                !generationError &&
                !previewImage &&
                currentDesign && (
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No preview available
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click Preview to generate
                    </p>
                  </div>
                )}

              {!currentDesign && (
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Upload a design to see preview
                  </p>
                </div>
              )}
            </div>
          )}

          {editorMode === "design" && (
            <EditorStage
              currentViewCode={currentViewCode}
              isDesignMode={editorMode === "design"}
              templateEl={templateEl}
              mockupLoaded={templateStatus === "loaded"}
            />
          )}
        </div>

        <EditorColorSwitcher />
      </div>
    </div>
  );
};

export default ProductEditor;
