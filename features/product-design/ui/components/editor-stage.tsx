import { useCallback, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Transformer,
  Group,
} from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { useShallow } from "zustand/react/shallow";
import { useProductDesignStore } from "../../store";
import { getPublicUrl } from "@/lib/r2";

type Props = {
  currentViewCode: "front" | "back";
  isDesignMode: boolean;
};

export const EditorStage = ({ currentViewCode, isDesignMode }: Props) => {
  const designRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // ===== STORE SELECTORS =====
  const { currentBaseSkuId, currentDesign, stageSize, currentProductColorId } =
    useProductDesignStore(
      useShallow((state) => ({
        currentBaseSkuId: state.editor.currentBaseSkuId,
        currentDesign: state.editor.currentDesign,
        stageSize: state.editor.stageSize,
        currentProductColorId: state.editor.currentProductColorId,
      })),
    );

  // Get cached product data
  const base = useProductDesignStore(
    (state) => state.bases.catalog[currentBaseSkuId || ""],
  );

  // Store actions
  const updateDesignAttributes = useProductDesignStore(
    (state) => state.updateDesignAttributes,
  );

  // ===== COMPUTED VALUES =====
  const currentView = base?.views?.[currentViewCode];
  const currentColor = base?.colors?.[currentProductColorId || ""];

  const sourceW = currentView?.template?.sourceWidthPx || 400;
  const sourceH = currentView?.template?.sourceHeightPx || 400;

  // Load images
  const [designImage] = useImage(
    currentDesign?.designR2Key ? getPublicUrl(currentDesign.designR2Key) : "",
  );
  const [mockupImage] = useImage(currentView?.template?.url || "");

  // ===== TRANSFORMER SYNC =====
  useEffect(() => {
    const transformer = transformerRef.current;
    const node = designRef.current;

    if (isDesignMode && currentDesign && transformer && node && designImage) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    } else if (transformer) {
      transformer.nodes([]);
    }
  }, [currentDesign, isDesignMode, designImage]);

  // ===== EVENT HANDLERS =====
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty && currentDesign) {
        // Deselect design
        transformerRef.current?.nodes([]);
      }
    },
    [currentDesign],
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!currentDesign || !currentView) return;
      const node = e.target;

      updateDesignAttributes({
        left: node.x() - currentView.printArea.x_px,
        top: node.y() - currentView.printArea.y_px,
      });
    },
    [currentDesign, updateDesignAttributes, currentView],
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      if (!currentDesign || !currentView) return;
      const node = designRef.current;
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const scale = (scaleX + scaleY) / 2;

      node.scaleX(1);
      node.scaleY(1);

      updateDesignAttributes({
        left: node.x() - currentView.printArea.x_px,
        top: node.y() - currentView.printArea.y_px,
        width: Math.max(10, node.width() * scale),
        height: Math.max(10, node.height() * scale),
        rotation: node.rotation(),
      });
    },
    [currentDesign, updateDesignAttributes, currentView],
  );

  const handleDesignClick = useCallback(() => {
    if (isDesignMode && designRef.current && transformerRef.current) {
      transformerRef.current.nodes([designRef.current]);
    }
  }, [isDesignMode]);

  // ===== EARLY RETURN FOR LOADING =====
  if (!base || !currentView) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100"
        style={{ width: stageSize.width, height: stageSize.height }}
      >
        <div className="text-gray-600">Loading stage...</div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <Stage
      width={sourceW}
      height={sourceH}
      scale={{
        x: stageSize.width / sourceW,
        y: stageSize.height / sourceH,
      }}
      style={{
        width: `${stageSize.width}px`,
        height: `${stageSize.height}px`,
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
      onMouseDown={handleStageClick}
      onTouchStart={handleStageClick}
      pixelRatio={Math.min(window.devicePixelRatio || 1, 2)}
    >
      <Layer>
        <Group x={0} y={0}>
          {/* Background Color */}
          <Rect
            x={0}
            y={0}
            width={sourceW}
            height={sourceH}
            fill={currentColor?.hexValue || "#F5F5DC"}
            listening={false}
          />

          {/* Mockup Template */}
          {mockupImage && (
            <KonvaImage
              image={mockupImage}
              x={0}
              y={0}
              width={sourceW}
              height={sourceH}
              listening={false}
            />
          )}

          {/* Print Area Guide (Design Mode Only) */}
          {isDesignMode && currentView.printArea && (
            <Rect
              x={currentView.printArea.x_px}
              y={currentView.printArea.y_px}
              width={currentView.printArea.width_px}
              height={currentView.printArea.height_px}
              fill="rgba(219,234,254,0.2)"
              stroke="rgba(147,51,234,0.4)"
              strokeWidth={1}
              dash={[5, 5]}
              listening={false}
            />
          )}

          {/* Design Layer */}
          {designImage && currentDesign && currentView.printArea && (
            <Group
              clipX={currentView.printArea.x_px}
              clipY={currentView.printArea.y_px}
              clipWidth={currentView.printArea.width_px}
              clipHeight={currentView.printArea.height_px}
            >
              <KonvaImage
                ref={designRef}
                image={designImage}
                x={currentDesign.left + currentView.printArea.x_px}
                y={currentDesign.top + currentView.printArea.y_px}
                width={currentDesign.width}
                height={currentDesign.height}
                rotation={currentDesign.rotation}
                draggable={isDesignMode}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                onClick={handleDesignClick}
                onTap={handleDesignClick}
              />
            </Group>
          )}
        </Group>

        {/* Transformer (Design Mode Only) */}
        {isDesignMode && designImage && currentDesign && (
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
            rotateEnabled
            keepRatio
            enabledAnchors={["bottom-right"]}
          />
        )}
      </Layer>
    </Stage>
  );
};
