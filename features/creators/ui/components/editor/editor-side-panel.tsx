"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { ExitEditorButton } from "./exit-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorSwatch, ColorSwatchRow } from "@/components/ui/color-swatch";
import { useEditorStore } from "../../../store/editor-store";
import { useShallow } from "zustand/react/shallow";

const BASE_PRICE = 20000;

export function EditorSidePanel({ ...props }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // ===== ZUSTAND STORE CONNECTION =====
  // Get editor data and color management state from store
  const { editorData, selectedColors, featuredColorId } = useEditorStore(
    useShallow((state) => ({
      editorData: state.editorData,
      selectedColors: state.selectedColors,
      featuredColorId: state.featuredColorId,
    })),
  );

  // Get color management actions from store
  const toggleColorSelection = useEditorStore(
    (state) => state.toggleColorSelection,
  );
  const setFeaturedColor = useEditorStore((state) => state.setFeaturedColor);

  // ===== LOCAL STATE (Only for pricing which isn't in store yet) =====
  const [price, setPrice] = useState<string>("45000");
  const [selectedView, setSelectedView] = useState<string>("front");

  // ===== COMPUTED VALUES =====
  // Calculate profit (price minus base price)
  const profit = useMemo(() => {
    const priceNum = Number.parseFloat(price) || 0;
    return Math.max(0, priceNum - BASE_PRICE);
  }, [price]);

  // Get available colors from editor data (replaces AVAILABLE_COLORS hardcoded array)
  const availableColors = useMemo(() => {
    return editorData?.colors || [];
  }, [editorData]);

  // Get base color options from selected colors (filtered from available colors)
  const baseColorOptions = useMemo(() => {
    return availableColors.filter((color) => selectedColors.includes(color.id));
  }, [availableColors, selectedColors]);

  // ===== EARLY RETURN FOR LOADING =====
  if (!editorData) {
    return (
      <Sidebar
        collapsible="none"
        {...props}
        className="px-4 h-screen"
        style={{ width: "400px" }}
      >
        <SidebarContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading sidebar...</div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // ===== EVENT HANDLERS =====
  /**
   * Handle color selection toggle.
   * Uses store action that manages the business logic for adding/removing colors
   * and automatically updates the featured color when needed.
   */
  const handleColorToggle = (colorId: string) => {
    toggleColorSelection(colorId);
  };

  const handlePriceChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    const priceNum = Number.parseFloat(numericValue) || 0;

    // Don't allow values below base price (but allow empty for editing)
    if (priceNum >= BASE_PRICE || numericValue === "") {
      setPrice(numericValue);
    }
  };

  const formatPrice = (amount: string | number) => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  return (
    <Sidebar
      collapsible="none"
      {...props}
      className="px-4 h-screen"
      style={{ width: "400px" }}
    >
      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            <Card className="gap-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Choose product colors <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription>
                  Select up to 5 backgrounds for your product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <ColorSwatch
                      key={color.id}
                      color={color}
                      size="md"
                      isSelected={selectedColors.includes(color.id)}
                      isSelectable={true}
                      isDisabled={
                        selectedColors.length >= 5 &&
                        !selectedColors.includes(color.id)
                      }
                      onSelect={handleColorToggle}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="gap-4">
              <CardHeader className="">
                <CardTitle className="text-lg">
                  Set your pricing <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription>
                  Enter your desired retail price for your customers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      UGX
                    </span>
                    <Input
                      id="price"
                      type="text"
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="pl-12 text-lg font-medium"
                      placeholder="45000"
                      min={BASE_PRICE}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm text-muted-foreground">
                      Profit/Sale:
                    </span>
                    <span className="text- font-medium text-green-600">
                      UGX {profit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Color Selection */}
            {selectedColors.length > 0 && (
              <Card className="gap-4">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Select featured color
                  </CardTitle>
                  <CardDescription>
                    This color will be used for display in your storefront
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ColorSwatchRow
                    colors={baseColorOptions}
                    totalColors={5}
                    maxVisible={5}
                    selectedColorId={featuredColorId || undefined}
                    isSelectable={true}
                    onColorSelect={setFeaturedColor}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <ExitEditorButton />
      </SidebarFooter>
    </Sidebar>
  );
}
