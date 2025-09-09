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
  const { currentBaseSkuId, currentDesign } = useProductDesignStore(
    useShallow((state) => ({
      currentBaseSkuId: state.editor.currentBaseSkuId,
      currentDesign: state.editor.currentDesign,
    })),
  );

  // Get cached product data
  const base = useProductDesignStore(
    (state) => state.bases.catalog[currentBaseSkuId || ""],
  );

  // ===== LOCAL STATE =====
  const [isViewPopoverOpen, setIsViewPopoverOpen] = useState(false);

  // ===== COMPUTED VALUES =====
  const views = base?.views ? Object.values(base.views) : [];
  const hasDesign = Boolean(currentDesign);

  const currentViewName =
    views.find((v) => v.code === editorView)?.displayName || "Front";

  // ===== EVENT HANDLERS =====
  const handleViewChange = (viewCode: "front" | "back") => {
    setEditorView(viewCode);
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
              {views.map((view) => (
                <li key={view.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start flex items-center gap-2",
                      editorView === view.code && "bg-accent",
                    )}
                    onClick={() => {
                      handleViewChange(view.code as "front" | "back");
                      setIsViewPopoverOpen(false);
                    }}
                  >
                    <span>{view.displayName}</span>
                    {editorView === view.code && (
                      <CheckIcon className="size-3 ml-auto" />
                    )}
                  </Button>
                </li>
              ))}
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
            onClick={() => setEditorMode("preview")}
          >
            <Eye className="size-3 mr-2" />
            Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
