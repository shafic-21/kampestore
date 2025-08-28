"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Upload, Eye, Edit3, RotateCcw } from "lucide-react";
import { useEditorStore } from "../../../store/editor-store";
import { createDesignElementFromImage, scalePrintAreaToCanvas } from "../../../lib/canvas-utils";
import type { EditorView } from "../../../types/editor.types";

interface EditorToolbarProps {
  views: EditorView[];
}

export default function EditorToolbar({ views }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    currentViewId,
    designMode,
    setCurrentView,
    setDesignMode,
    addDesignElement,
    setUploadingImage,
    isUploadingImage,
  } = useEditorStore();

  const currentView = views.find(v => v.id === currentViewId);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentView?.printArea) return;

    setUploadingImage(true);

    try {
      // Create object URL for the uploaded file
      const imageUrl = URL.createObjectURL(file);
      
      // For now, we'll use a mock canvas size - in real implementation,
      // this would come from the actual canvas dimensions
      const mockCanvasSize = { width: 800, height: 600 };
      const printArea = scalePrintAreaToCanvas(
        currentView.printArea,
        mockCanvasSize.width,
        mockCanvasSize.height
      );

      // Create design element
      const designElement = await createDesignElementFromImage(
        imageUrl,
        printArea
      );

      addDesignElement(designElement);
    } catch (error) {
      console.error("Failed to upload image:", error);
      // TODO: Show error toast
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2">
      {/* Image Upload */}
      <Button
        variant="outline"
        size="sm"
        onClick={triggerImageUpload}
        disabled={isUploadingImage || !currentView?.printArea}
        className="gap-2"
      >
        <Upload className="size-4" />
        {isUploadingImage ? "Uploading..." : "Upload Image"}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <Separator orientation="vertical" className="h-8" />

      {/* View Selector */}
      <div className="flex gap-1">
        {views.map((view) => (
          <Button
            key={view.id}
            variant={currentViewId === view.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentView(view.id)}
            className="min-w-0 px-3"
          >
            {view.displayName}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Design/Preview Toggle */}
      <div className="flex gap-1">
        <Button
          variant={designMode === "design" ? "default" : "outline"}
          size="sm"
          onClick={() => setDesignMode("design")}
          className="gap-2"
        >
          <Edit3 className="size-4" />
          Design
        </Button>
        
        <Button
          variant={designMode === "preview" ? "default" : "outline"}
          size="sm"
          onClick={() => setDesignMode("preview")}
          className="gap-2"
        >
          <Eye className="size-4" />
          Preview
        </Button>
      </div>
    </div>
  );
}