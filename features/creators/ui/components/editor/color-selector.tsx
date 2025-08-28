"use client";

import { useEditorStore } from "../../../store/editor-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorSelectorProps {
  colors: Array<{
    id: string;
    hexColor: string;
    displayName: string;
  }>;
}

export default function ColorSelector({ colors }: ColorSelectorProps) {
  const { selectedColors, toggleColorSelection } = useEditorStore();

  const isLightColor = (hexColor: string): boolean => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 200;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Choose product colors
          <span className="text-destructive">*</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select up to 5 backgrounds for your product
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-6 gap-3">
          {colors.map((color) => {
            const isSelected = selectedColors.includes(color.id);
            const isLight = isLightColor(color.hexColor);
            
            return (
              <button
                key={color.id}
                className={cn(
                  "aspect-square rounded-full relative transition-all duration-200 hover:scale-110",
                  isSelected && "ring-2 ring-primary ring-offset-2",
                  isLight && "border border-gray-200"
                )}
                style={{ backgroundColor: color.hexColor }}
                onClick={() => toggleColorSelection(color.id)}
                title={color.displayName}
                disabled={!isSelected && selectedColors.length >= 5}
              >
                {isSelected && (
                  <Check 
                    className={cn(
                      "size-4 absolute inset-0 m-auto",
                      isLight ? "text-gray-800" : "text-white"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {selectedColors.length === 0 && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Please select at least one color to continue
          </p>
        )}

        <div className="text-xs text-muted-foreground">
          {selectedColors.length}/5 colors selected
        </div>
      </CardContent>
    </Card>
  );
}