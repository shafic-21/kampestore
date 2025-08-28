"use client";

import { useState } from "react";
import { useEditorStore } from "../../../store/editor-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ColorSelector from "./color-selector";
import PriceCalculator from "./price-calculator";
import DisplaySettings from "./display-settings";

interface EditorSidebarProps {
  colors: Array<{
    id: string;
    hexColor: string;
    displayName: string;
  }>;
  baseCost: string;
}

export default function EditorSidebar({ colors, baseCost }: EditorSidebarProps) {
  const { selectedColors } = useEditorStore();

  return (
    <div className="w-80 border-l bg-card/50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Color Selection */}
        <ColorSelector colors={colors} />

        {/* Price Calculator */}
        <PriceCalculator baseCost={baseCost} />

        {/* Display Settings */}
        <DisplaySettings selectedColors={selectedColors} colors={colors} />
      </div>
    </div>
  );
}
