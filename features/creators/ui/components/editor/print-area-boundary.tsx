"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import Konva components
const KonvaRect = dynamic(() => import("react-konva").then(mod => mod.Rect), {
  ssr: false,
  loading: () => null,
});

const KonvaLine = dynamic(() => import("react-konva").then(mod => mod.Line), {
  ssr: false,
  loading: () => null,
});

const KonvaText = dynamic(() => import("react-konva").then(mod => mod.Text), {
  ssr: false,
  loading: () => null,
});

interface PrintAreaBoundaryProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PrintAreaBoundary({
  x,
  y,
  width,
  height,
}: PrintAreaBoundaryProps) {
  return (
    <>
      {/* Main boundary rectangle */}
      <KonvaRect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="#ef4444"
        strokeWidth={2}
        dash={[5, 5]}
        fill="rgba(239, 68, 68, 0.05)"
      />
      
      {/* Corner markers */}
      {[
        { cx: x, cy: y }, // top-left
        { cx: x + width, cy: y }, // top-right  
        { cx: x, cy: y + height }, // bottom-left
        { cx: x + width, cy: y + height }, // bottom-right
      ].map((corner, index) => (
        <React.Fragment key={index}>
          <KonvaLine
            points={[corner.cx - 10, corner.cy, corner.cx + 10, corner.cy]}
            stroke="#ef4444"
            strokeWidth={2}
          />
          <KonvaLine
            points={[corner.cx, corner.cy - 10, corner.cx, corner.cy + 10]}
            stroke="#ef4444"
            strokeWidth={2}
          />
        </React.Fragment>
      ))}

      {/* Print area label */}
      <KonvaText
        x={x + 8}
        y={y + 8}
        text="Print Area"
        fontSize={12}
        fontFamily="Inter, sans-serif"
        fill="#ef4444"
        fontStyle="bold"
      />
    </>
  );
}