import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  color: {
    id: string;
    hexColor: string;
    displayName: string;
  };
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function ColorSwatch({ color, size = "xs", className }: ColorSwatchProps) {
  const sizeClasses = {
    xs: "size-3",
    sm: "size-4", 
    md: "size-6",
  };

  const isLight = isLightColor(color.hexColor);

  return (
    <div
      className={cn(
        "rounded-full flex-shrink-0",
        sizeClasses[size],
        isLight && "border border-gray-200",
        className
      )}
      style={{ backgroundColor: color.hexColor }}
      title={color.displayName}
    />
  );
}

interface ColorSwatchRowProps {
  colors: Array<{
    id: string;
    hexColor: string;
    displayName: string;
  }>;
  totalColors: number;
  maxVisible?: number;
  className?: string;
}

export function ColorSwatchRow({ 
  colors, 
  totalColors, 
  maxVisible = 8, 
  className 
}: ColorSwatchRowProps) {
  const visibleColors = colors.slice(0, maxVisible);
  const remainingCount = totalColors - maxVisible;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {visibleColors.map((color) => (
        <ColorSwatch key={color.id} color={color} size="xs" />
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
}