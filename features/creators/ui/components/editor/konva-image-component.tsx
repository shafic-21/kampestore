"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { loadImage } from "../../../lib/canvas-utils";

// Dynamically import Konva Image component
const KonvaImage = dynamic(() => import("react-konva").then(mod => mod.Image), {
  ssr: false,
  loading: () => null,
});

interface KonvaImageProps {
  src: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  opacity?: number;
}

export default function KonvaImageComponent({
  src,
  width,
  height,
  x = 0,
  y = 0,
  opacity = 1,
}: KonvaImageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
    
    loadImage(src)
      .then(setImage)
      .catch((err) => {
        console.error("Failed to load image:", err);
        setError(true);
      });
  }, [src]);

  if (error) {
    return null; // Could render a fallback rectangle here
  }

  if (!image) {
    return null; // Loading state
  }

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={opacity}
    />
  );
}