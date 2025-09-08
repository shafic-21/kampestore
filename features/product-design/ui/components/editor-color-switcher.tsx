import { ColorSwatch } from "@/components/ui/color-swatch";
import { useMemo } from "react";
import { useProductDesignStore } from "../../store";
import { createColorMap } from "../../utils";
import { useShallow } from "zustand/react/shallow";

export const EditorColorSwitcher = ({}) => {
  const { currentBaseSkuId, selectedColors, currentProductColorId } =
    useProductDesignStore(
      useShallow((state) => ({
        currentBaseSkuId: state.editor.currentBaseSkuId,
        selectedColors: state.editor.selectedColors,
        currentProductColorId: state.editor.currentProductColorId,
      })),
    );

  const setCurrentProductColor = useProductDesignStore(
    (state) => state.setCurrentProductColor,
  );

  const base = useProductDesignStore((state) =>
    currentBaseSkuId ? state.bases.catalog[currentBaseSkuId] : null,
  );

  const availableColors = useMemo(
    () => (base?.colors ? Object.values(base.colors) : []),
    [base?.colors],
  );

  const colorMap = createColorMap(availableColors);

  const handleColorSelect = (colorId: string) => {
    setCurrentProductColor(colorId);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-8">
      {selectedColors.map((colorId) => (
        <ColorSwatch
          key={colorId}
          color={colorMap[colorId]}
          size="lg"
          isSelected={currentProductColorId === colorId}
          isSelectable={true}
          onSelect={handleColorSelect}
        />
      ))}
    </div>
  );
};
