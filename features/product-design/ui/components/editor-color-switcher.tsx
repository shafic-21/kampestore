import { ColorSwatch } from "@/components/ui/color-swatch";
import { useMemo } from "react";
import { useProductDesignStore } from "../../store";
import { createColorMap } from "../../utils";
import { useShallow } from "zustand/react/shallow";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { usePreviewGenerator } from "../../hooks/use-preview-generator";

export const EditorColorSwitcher = ({}) => {
  // ===== URL STATE =====
  const [editorMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["design", "preview"]).withDefault("design"),
  );

  const [editorView] = useQueryState(
    "view",
    parseAsStringLiteral(["front", "back"]).withDefault("front"),
  );

  // ===== STORE SELECTORS =====
  const { currentBaseSkuId, selectedColors, currentProductColorId, currentDesign, previews } =
    useProductDesignStore(
      useShallow((state) => ({
        currentBaseSkuId: state.editor.currentBaseSkuId,
        selectedColors: state.editor.selectedColors,
        currentProductColorId: state.editor.currentProductColorId,
        currentDesign: state.editor.currentDesigns[editorView],
        previews: state.editor.previews, // Add this
      })),
    );

  const setCurrentProductColor = useProductDesignStore(
    (state) => state.setCurrentProductColor,
  );

  const base = useProductDesignStore((state) =>
    currentBaseSkuId ? state.bases.catalog[currentBaseSkuId] : null,
  );

  // ===== PREVIEW GENERATOR =====
  const { handleGeneratePreview, isGenerating } = usePreviewGenerator();

  // ===== COMPUTED VALUES =====
  const availableColors = useMemo(
    () => (base?.colors ? Object.values(base.colors) : []),
    [base?.colors],
  );

  const colorMap = createColorMap(availableColors);

  // ===== EVENT HANDLERS =====
  const handleColorSelect = async (colorId: string) => {
    if (editorMode !== "preview" || !currentDesign) {
      setCurrentProductColor(colorId);
      return;
    }
  
    const cacheKey = `${editorView}_${colorId}`;
    const hasCache = Boolean(previews[cacheKey]);
  
    if (hasCache) {
      // Cache exists - immediate switch + background regen
      setCurrentProductColor(colorId);
      handleGeneratePreview(editorView, colorId).catch(console.error);
    } else {
      // No cache - wait for generation, then switch
      try {
        await handleGeneratePreview(editorView, colorId);
        setCurrentProductColor(colorId);
      } catch (error) {
        console.error("Failed to generate preview for color switch:", error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-8">
      {selectedColors.map((colorId) => (
        <ColorSwatch
          key={colorId}
          color={colorMap[colorId]}
          size="lg"
          isSelected={currentProductColorId === colorId}
          isSelectable={!isGenerating}
          onSelect={handleColorSelect}
          className={isGenerating ? "cursor-wait" : undefined}
        />
      ))}
    </div>
  );
};
