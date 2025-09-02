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
import { Check } from "lucide-react";
import { ExitEditorButton } from "./exit-editor";
import { ScrollArea } from "@/components/ui/scroll-area";

const BASE_PRICE = 20000;

const AVAILABLE_COLORS = [
  { name: "Natural", value: "#F5F5DC", hex: "#F5F5DC" },
  { name: "Black", value: "#000000", hex: "#000000" },
  { name: "White", value: "#FFFFFF", hex: "#FFFFFF" },
  { name: "Navy", value: "#1E3A8A", hex: "#1E3A8A" },
  { name: "Purple", value: "#7C3AED", hex: "#7C3AED" },
  { name: "Red", value: "#DC2626", hex: "#DC2626" },
  { name: "Green", value: "#16A34A", hex: "#16A34A" },
  { name: "Orange", value: "#EA580C", hex: "#EA580C" },
  { name: "Pink", value: "#EC4899", hex: "#EC4899" },
  { name: "Gray", value: "#6B7280", hex: "#6B7280" },
];

export function EditorSidePanel({ ...props }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [selectedColors, setSelectedColors] = useState<string[]>(["#F5F5DC"]);
  const [price, setPrice] = useState<string>("45000");
  const [selectedView, setSelectedView] = useState<string>("front");
  const [baseColor, setBaseColor] = useState<string>("#F5F5DC");

  // Calculate profit (price minus base price)
  const profit = useMemo(() => {
    const priceNum = Number.parseFloat(price) || 0;
    return Math.max(0, priceNum - BASE_PRICE);
  }, [price]);

  // Get base color options from selected colors
  const baseColorOptions = useMemo(() => {
    return AVAILABLE_COLORS.filter((color) =>
      selectedColors.includes(color.hex),
    );
  }, [selectedColors]);

  const handleColorToggle = (colorHex: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(colorHex)) {
        const newColors = prev.filter((c) => c !== colorHex);
        // If removing the current base color, set base color to first remaining color
        if (colorHex === baseColor && newColors.length > 0) {
          setBaseColor(newColors[0]);
        }
        return newColors;
      } else if (prev.length < 5) {
        return [...prev, colorHex];
      }
      return prev;
    });
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Choose product colors <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription>
                  Select up to 5 backgrounds for your product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => handleColorToggle(color.hex)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 relative transition-all hover:scale-105",
                        selectedColors.includes(color.hex)
                          ? "border-primary shadow-md"
                          : "border-border hover:border-muted-foreground",
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColors.includes(color.hex) && (
                        <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedColors.length}/5 colors selected
                </p>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Set your pricing <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription>
                  Enter your desired retail price for fans from different
                  regions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm">
                    Price (UGX)
                  </Label>
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
                    <span className="text-sm font-medium text-green-600">
                      UGX {profit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Color Selection */}
            {selectedColors.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Select featured color
                  </CardTitle>
                  <CardDescription>
                    This color will be used for display in your storefront
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {baseColorOptions.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setBaseColor(color.hex)}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 relative transition-all hover:scale-105",
                          baseColor === color.hex
                            ? "border-primary shadow-md"
                            : "border-border hover:border-muted-foreground",
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {baseColor === color.hex && (
                          <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
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
