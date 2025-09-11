import { ColorSwatch } from "@/components/ui/color-swatch";
import { useMemo } from "react";
import { useEditorStore } from "../../../store/editor-store";
import { useShallow } from "zustand/react/shallow";

/**
 * EditorColorSwitcher Component
 *
 * Displays the colors selected in the sidebar and allows switching between them
 * to see how the product looks in different colors. This connects to the Zustand
 * store to get the selected colors and current product color.
 *
 * ARCHITECTURE:
 * - Gets selected colors from store (managed by sidebar)
 * - Shows current product color state
 * - Updates current product color when user clicks a different color
 *
 * DATA FLOW:
 * 1. Sidebar manages which colors are selected (up to 5)
 * 2. This component displays those selected colors
 * 3. User clicks a color to change the product appearance
 * 4. Store updates currentProductColorId
 * 5. Canvas component reacts to this change to update product color
 */
export const EditorColorSwitcher = () => {
	// ===== ZUSTAND STORE CONNECTION =====
	// Get editor data and color state from store
	const { editorData, selectedColors, currentProductColorId } = useEditorStore(
		useShallow((state) => ({
			editorData: state.editorData,
			selectedColors: state.selectedColors,
			currentProductColorId: state.currentProductColorId,
		})),
	);

	// Get color management action from store
	const setCurrentProductColor = useEditorStore(
		(state) => state.setCurrentProductColor,
	);

	// ===== COMPUTED VALUES =====
	// Get the actual color objects for selected color IDs
	const selectedColorObjects = useMemo(() => {
		if (!editorData?.colors || selectedColors.length === 0) {
			return [];
		}

		// Filter available colors to only include selected ones, maintaining order
		return selectedColors
			.map((colorId) => editorData.colors.find((color) => color.id === colorId))
			.filter(Boolean) as typeof editorData.colors;
	}, [editorData?.colors, selectedColors]);

	// ===== EARLY RETURN FOR LOADING OR NO COLORS =====
	if (!editorData || selectedColorObjects.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 px-4 py-8">
				<div className="text-sm text-muted-foreground">No colors selected</div>
			</div>
		);
	}

	// ===== EVENT HANDLERS =====
	/**
	 * Handle color selection for product display.
	 * Updates the current product color in the store which affects canvas background.
	 */
	const handleColorSelect = (colorId: string) => {
		setCurrentProductColor(colorId);
	};

	// ===== RENDER =====
	return (
		<div className="flex flex-col items-center justify-center gap-4 px-4 py-8">
			{selectedColorObjects.map((color) => (
				<ColorSwatch
					key={color.id}
					color={color}
					size="lg"
					isSelected={currentProductColorId === color.id}
					isSelectable={true}
					onSelect={handleColorSelect}
				/>
			))}
		</div>
	);
};
