"use client";

import { useState } from "react";
import { useEditorStore } from "../../../store/editor-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisplaySettingsProps {
  selectedColors: string[];
  colors: Array<{
    id: string;
    hexColor: string;
    displayName: string;
  }>;
}

export default function DisplaySettings({ selectedColors, colors }: DisplaySettingsProps) {
  const [selectedView, setSelectedView] = useState<"front" | "back">("front");
  const [featuredColor, setFeaturedColor] = useState<string>("");

  // Get only the colors that are selected
  const availableColors = colors.filter(color => selectedColors.includes(color.id));

  const isLightColor = (hexColor: string): boolean => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 200;
  };

  // Auto-select first color as featured if none selected
  if (!featuredColor && availableColors.length > 0) {
    setFeaturedColor(availableColors[0].id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Choose how you showcase this design</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set how this design appears in your store
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* View Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Select the featured view (Front)
          </Label>
          
          <div className="flex gap-3">
            <button
              className={cn(
                "flex-1 aspect-square rounded-lg border-2 transition-all duration-200 hover:border-primary/50 relative overflow-hidden",
                selectedView === "front" ? "border-primary bg-primary/5" : "border-border"
              )}
              onClick={() => setSelectedView("front")}
            >
              <div className="flex items-center justify-center h-full">
                <Shirt className="size-8 text-muted-foreground" />
              </div>
              {selectedView === "front" && (
                <div className="absolute top-2 right-2">
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="size-3" />
                  </div>
                </div>
              )}
            </button>
            
            <button
              className={cn(
                "flex-1 aspect-square rounded-lg border-2 transition-all duration-200 hover:border-primary/50 relative overflow-hidden opacity-50 cursor-not-allowed",
                "border-border"
              )}
              disabled
            >
              <div className="flex items-center justify-center h-full">
                <Shirt className="size-8 text-muted-foreground rotate-180" />
              </div>
            </button>
          </div>
        </div>

        {/* Featured Color Selection */}
        {availableColors.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Featured color ({availableColors.find(c => c.id === featuredColor)?.displayName || "White"})
            </Label>
            
            <div className="flex gap-2 flex-wrap">
              {availableColors.map((color) => {
                const isSelected = featuredColor === color.id;
                const isLight = isLightColor(color.hexColor);
                
                return (
                  <button
                    key={color.id}
                    className={cn(
                      "size-8 rounded-full relative transition-all duration-200 hover:scale-110",
                      isSelected && "ring-2 ring-primary ring-offset-2",
                      isLight && "border border-gray-200"
                    )}
                    style={{ backgroundColor: color.hexColor }}
                    onClick={() => setFeaturedColor(color.id)}
                    title={color.displayName}
                  >
                    {isSelected && (
                      <Check 
                        className={cn(
                          "size-3 absolute inset-0 m-auto",
                          isLight ? "text-gray-800" : "text-white"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedColors.length === 0 && (
          <div className="text-center py-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Select colors above to choose display settings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}