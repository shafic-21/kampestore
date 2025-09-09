import { useState } from "react";
import { useProductDesignStore } from "../store";
import { useShallow } from "zustand/react/shallow";

export const usePreviewGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { generatePreview } = useProductDesignStore(
    useShallow((state) => ({
      generatePreview: state.generatePreview,
    })),
  );

  const handleGeneratePreview = async (viewCode: string, colorId: string) => {
    // Get the design for this specific view
    const currentDesign = useProductDesignStore.getState().editor.currentDesigns[viewCode];
    
    if (!currentDesign) {
      setGenerationError("No design uploaded for this view");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      await generatePreview(viewCode, colorId);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to generate preview";
      setGenerationError(errorMessage);
      console.error('Preview generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearError = () => {
    setGenerationError(null);
  };

  return { 
    handleGeneratePreview, 
    isGenerating, 
    generationError,
    clearError,
  };
};