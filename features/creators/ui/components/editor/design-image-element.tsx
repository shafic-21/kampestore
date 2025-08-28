"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";

// Dynamically import Konva components
const KonvaGroup = dynamic(() => import("react-konva").then(mod => mod.Group), {
  ssr: false,
  loading: () => null,
});

const KonvaImage = dynamic(() => import("react-konva").then(mod => mod.Image), {
  ssr: false,
  loading: () => null,
});

const KonvaRect = dynamic(() => import("react-konva").then(mod => mod.Rect), {
  ssr: false,
  loading: () => null,
});

const KonvaCircle = dynamic(() => import("react-konva").then(mod => mod.Circle), {
  ssr: false,
  loading: () => null,
});

const KonvaLine = dynamic(() => import("react-konva").then(mod => mod.Line), {
  ssr: false,
  loading: () => null,
});
import { useEditorStore } from "../../../store/editor-store";
import { loadImage, constrainToDragBounds } from "../../../lib/canvas-utils";
import type { DesignElement } from "../../../types/editor.types";

interface DesignImageElementProps {
  element: DesignElement;
  isSelected: boolean;
  isDesignMode: boolean;
  printArea: { x: number; y: number; width: number; height: number } | null;
}

export default function DesignImageElement({
  element,
  isSelected,
  isDesignMode,
  printArea,
}: DesignImageElementProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const groupRef = useRef<Konva.Group>(null);
  
  const { 
    updateDesignElement, 
    setSelectedElement, 
    removeDesignElement 
  } = useEditorStore();

  // Load image
  useEffect(() => {
    loadImage(element.imageUrl)
      .then(setImage)
      .catch(console.error);
  }, [element.imageUrl]);

  const handleDragStart = () => {
    setIsDragging(true);
    setSelectedElement(element.id);
  };

  const handleDragEnd = (e: any) => {
    setIsDragging(false);
    
    if (printArea) {
      const constrainedPos = constrainToDragBounds(
        {
          x: e.target.x(),
          y: e.target.y(),
          width: element.width,
          height: element.height,
        },
        printArea
      );
      
      updateDesignElement(element.id, {
        x: constrainedPos.x,
        y: constrainedPos.y,
      });
    }
  };

  const handleTransform = () => {
    if (!groupRef.current) return;
    
    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Update element with new scale (maintaining aspect ratio)
    const newWidth = element.width * scaleX;
    const newHeight = element.height * scaleY;
    
    updateDesignElement(element.id, {
      width: newWidth,
      height: newHeight,
      scaleX: element.scaleX * scaleX,
      scaleY: element.scaleY * scaleY,
      rotation: node.rotation(),
    });
    
    // Reset scale to 1 after applying changes
    node.scaleX(1);
    node.scaleY(1);
  };

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    setSelectedElement(element.id);
  };

  const handleDelete = () => {
    removeDesignElement(element.id);
  };

  if (!image) return null;

  return (
    <KonvaGroup
      ref={groupRef}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={isDesignMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransform={handleTransform}
      onTransformEnd={handleTransform}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Main Image */}
      <KonvaImage
        image={image}
        width={element.width}
        height={element.height}
        opacity={isDragging ? 0.7 : 1}
      />

      {/* Selection Handles */}
      {isSelected && isDesignMode && (
        <>
          {/* Selection border */}
          <KonvaRect
            width={element.width}
            height={element.height}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[4, 4]}
            fill="transparent"
          />

          {/* Delete button */}
          <KonvaCircle
            x={-8}
            y={-8}
            radius={8}
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth={2}
            onClick={handleDelete}
            onTap={handleDelete}
          />
          <KonvaLine
            points={[-12, -12, -4, -4]}
            stroke="white"
            strokeWidth={2}
          />
          <KonvaLine
            points={[-4, -12, -12, -4]}
            stroke="white"
            strokeWidth={2}
          />

          {/* Rotate handle */}
          <KonvaCircle
            x={element.width / 2}
            y={-20}
            radius={6}
            fill="#22d3ee"
            stroke="#ffffff"
            strokeWidth={2}
          />
          <KonvaLine
            points={[element.width / 2, -8, element.width / 2, -14]}
            stroke="#22d3ee"
            strokeWidth={2}
          />

          {/* Scale handle (bottom-right) */}
          <KonvaRect
            x={element.width - 6}
            y={element.height - 6}
            width={12}
            height={12}
            fill="#22c55e"
            stroke="#ffffff"
            strokeWidth={2}
            cornerRadius={2}
          />
        </>
      )}
    </KonvaGroup>
  );
}