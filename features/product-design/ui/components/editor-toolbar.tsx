"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Edit3,
  Eye,
  ImageIcon,
  ChevronDownIcon,
  CheckIcon,
} from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useProductDesignStore } from "../../store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { usePreviewGenerator } from "../../hooks/use-preview-generator";

interface Props {
  handleDesignUpload: () => void;
}

export function EditorToolbar({ handleDesignUpload }: Props) {
  // ===== URL STATE =====
  const [editorMode, setEditorMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["design", "preview"]).withDefault("design"),
  );

  const [editorView, setEditorView] = useQueryState(
    "view",
    parseAsStringLiteral(["front", "back"]).withDefault("front"),
  );

  const [listingId] = useQueryState("listingId", parseAsString.withDefault(""));

  // ===== STORE SELECTORS =====
  const { currentBaseSkuId, currentDesign, currentProductColorId, previews, currentDesigns } =
    useProductDesignStore(
      useShallow((state) => ({
        currentBaseSkuId: state.editor.currentBaseSkuId,
        currentDesign: state.editor.currentDesigns[editorView],
        currentProductColorId: state.editor.currentProductColorId,
        previews: state.editor.previews,
        currentDesigns: state.editor.currentDesigns,
      })),
    );

  // Get cached product data
  const base = useProductDesignStore(
    (state) => state.bases.catalog[currentBaseSkuId || ""],
  );

  // ===== LOCAL STATE =====
  const [isViewPopoverOpen, setIsViewPopoverOpen] = useState(false);

  // ===== PREVIEW GENERATOR =====
  const { handleGeneratePreview, isGenerating, generationError } =
    usePreviewGenerator();

  // ===== COMPUTED VALUES =====
  const views = base?.views ? Object.values(base.views) : [];
  const hasDesign = Boolean(currentDesign);

  const currentViewName =
    views.find((v) => v.code === editorView)?.displayName || "Front";

  // ===== EVENT HANDLERS =====
  const handleViewChange = (viewCode: "front" | "back") => {
    // In preview mode, prevent switching to views without designs
    if (editorMode === "preview" && !currentDesigns[viewCode]) {
      return;
    }
    setEditorView(viewCode);
  };

  const handlePreviewClick = async () => {
    if (!hasDesign || !currentProductColorId) {
      setEditorMode("preview");
      return;
    }
  
    const cacheKey = `${editorView}_${currentProductColorId}`;
    const hasCache = Boolean(previews[cacheKey]);
  
    if (hasCache) {
      // Cache exists - immediate switch + background regen
      setEditorMode("preview");
      handleGeneratePreview(editorView, currentProductColorId).catch(console.error);
    } else {
      // No cache - wait for generation, then switch
      try {
        await handleGeneratePreview(editorView, currentProductColorId);
        setEditorMode("preview");
      } catch (error) {
        console.error("Preview generation failed:", error);
      }
    }
  };

  // ===== EARLY RETURN FOR LOADING =====
  if (!base) {
    return (
      <div className="z-10">
        <div className="bg-background border px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="text-muted-foreground">Loading toolbar...</div>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="z-10">
      <div className="bg-background border px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4">
        {/* Upload/Change Design Button */}
        <Button
          variant="ghost"
          onClick={handleDesignUpload}
          className="flex items-center gap-2"
          disabled={editorMode === "preview" || Boolean(listingId)}
        >
          <ImageIcon className="size-4" />
          <span>{hasDesign ? "Change Design" : "Upload Design"}</span>
        </Button>

        {/* View Selector Dropdown */}
        <Popover open={isViewPopoverOpen} onOpenChange={setIsViewPopoverOpen}>
          <PopoverTrigger className={cn(buttonVariants({ variant: "ghost" }))}>
            <span className="flex items-center gap-2">
              {currentViewName}
              <ChevronDownIcon className="size-3" />
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-2">
            <ul className="flex flex-col gap-1">
              {views.map((view) => {
                const hasViewDesign = Boolean(currentDesigns[view.code]);
                const isDisabled = editorMode === "preview" && !hasViewDesign;
                
                return (
                  <li key={view.id}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start flex items-center gap-2",
                        editorView === view.code && "bg-accent",
                        isDisabled && "opacity-50 cursor-not-allowed",
                      )}
                      onClick={() => {
                        if (!isDisabled) {
                          handleViewChange(view.code as "front" | "back");
                          setIsViewPopoverOpen(false);
                        }
                      }}
                      disabled={isDisabled}
                    >
                      <span>{view.displayName}</span>
                      {editorView === view.code && (
                        <CheckIcon className="size-3 ml-auto" />
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>

        {/* Mode Toggle (Design/Preview) */}
        <div className="bg-accent rounded-xl flex p-1">
          <Button
            variant="ghost"
            className={cn(
              "rounded-full text-muted-foreground/80 hover:text-muted-foreground transition-all",
              editorMode === "design" && [
                "bg-foreground text-background",
                "hover:bg-foreground hover:text-background",
              ],
            )}
            onClick={() => setEditorMode("design")}
          >
            <Edit3 className="size-3 mr-2" />
            Design
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "rounded-full text-muted-foreground/80 hover:text-muted-foreground transition-all",
              editorMode === "preview" && [
                "bg-foreground text-background",
                "hover:bg-foreground hover:text-background",
              ],
            )}
            onClick={handlePreviewClick}
            disabled={isGenerating || !hasDesign}
          >
            <Eye className="size-3 mr-2" />
            {isGenerating ? "Generating..." : "Preview"}
          </Button>
        </div>
      </div>
    </div>
  );
}
