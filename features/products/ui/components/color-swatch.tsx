import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  color: {
    id: string;
    hexColor: string;
    displayName: string;
  };
  size?: "sm" | "md";
  className?: string;
}

export function ColorSwatch({ color, size = "sm", className }: ColorSwatchProps) {
  const sizeClasses = {
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
    <div className={cn("flex items-center gap-1.5", className)}>
      {visibleColors.map((color) => (
        <ColorSwatch key={color.id} color={color} />
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
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
}