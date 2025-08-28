"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { calculatePrintQuality, getPrintQualityBgColor, formatPrintQualityMessage } from "../../../lib/print-quality";
import type { DesignElement, EditorPrintArea } from "../../../types/editor.types";
import { cn } from "@/lib/utils";

interface PrintQualityIndicatorProps {
  element: DesignElement;
  printArea: EditorPrintArea;
  className?: string;
}

export default function PrintQualityIndicator({
  element,
  printArea,
  className,
}: PrintQualityIndicatorProps) {
  const quality = calculatePrintQuality(element, printArea.dpi);
  const message = formatPrintQualityMessage(quality);

  const getIcon = () => {
    switch (quality) {
      case "great":
        return <CheckCircle className="size-3" />;
      case "good":
        return <Info className="size-3" />;
      case "poor":
        return <AlertTriangle className="size-3" />;
      default:
        return <Info className="size-3" />;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Badge 
        variant="secondary" 
        className={cn("gap-1 capitalize", getPrintQualityBgColor(quality))}
      >
        {getIcon()}
        Print Quality: {quality}
      </Badge>
      
      <p className="text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  );
}