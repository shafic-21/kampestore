"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@automattic/format-currency";
import { cn } from "@/lib/utils";

interface PriceCalculatorProps {
  baseCost: string;
}

export default function PriceCalculator({ baseCost }: PriceCalculatorProps) {
  const [retailPrice, setRetailPrice] = useState<string>("");
  const [profit, setProfit] = useState<number>(0);
  
  const baseCostNumber = Number(baseCost);
  const minRetailPrice = Math.ceil(baseCostNumber * 1.1); // 10% minimum markup

  useEffect(() => {
    const price = parseFloat(retailPrice) || 0;
    if (price > 0) {
      const profitAmount = Math.floor(price) - baseCostNumber;
      setProfit(profitAmount > 0 ? profitAmount : 0);
    } else {
      setProfit(0);
    }
  }, [retailPrice, baseCost, baseCostNumber]);

  const handlePriceChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^\d.]/g, "");
    setRetailPrice(numericValue);
  };

  const isValidPrice = parseFloat(retailPrice) >= minRetailPrice;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Set your price</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your desired retail price for customers
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="retail-price">Retail Price (UGX)</Label>
          <Input
            id="retail-price"
            type="text"
            placeholder={`Min: ${formatCurrency(minRetailPrice, "UGX")}`}
            value={retailPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
            className={cn(
              "text-lg font-medium",
              !isValidPrice && retailPrice && "border-destructive focus:border-destructive"
            )}
          />
          {!isValidPrice && retailPrice && (
            <p className="text-sm text-destructive">
              Price must be at least {formatCurrency(minRetailPrice, "UGX")}
            </p>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex justify-between text-sm">
            <span>Base cost:</span>
            <span>{formatCurrency(baseCostNumber, "UGX")}</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-green-600">
            <span>Your profit:</span>
            <span>{formatCurrency(profit, "UGX")}</span>
          </div>
        </div>

        {retailPrice && isValidPrice && (
          <div className="text-xs text-muted-foreground">
            Profit margin: {((profit / parseFloat(retailPrice)) * 100).toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}