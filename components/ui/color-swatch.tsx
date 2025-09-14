import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";

interface ColorSwatchProps {
	color: {
		id: string;
		hexValue: string;
		displayName: string;
	};
	size?: "xs" | "sm" | "md" | "lg";
	className?: string;
	isSelected?: boolean;
	isSelectable?: boolean;
	isDisabled?: boolean;
	onSelect?: (colorId: string) => void;
}

export function ColorSwatch({
	color,
	size = "xs",
	className,
	isSelected = false,
	isSelectable = false,
	isDisabled = false,
	onSelect,
}: ColorSwatchProps) {
	const sizeClasses = {
		xs: "size-3",
		sm: "size-4",
		md: "size-6",
		lg: "size-8",
	};

	const checkSizes = {
		xs: "size-2",
		sm: "size-2.5",
		md: "size-2.5",
		lg: "size-2.5",
	};

	const isLight = isLightColor(color.hexValue);

	const handleClick = () => {
		if (isSelectable && !isDisabled && onSelect) {
			onSelect(color.id);
		}
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn(
						"rounded-full flex-shrink-0 relative flex items-center justify-center",
						sizeClasses[size],
						isLight && "border border-gray-200",
						isSelectable &&
							!isDisabled &&
							"cursor-pointer hover:scale-110 transition-transform",
						isDisabled && "cursor-not-allowed",
						isSelected && "ring-2 ring-offset-1 ring-primary",
						className,
					)}
					style={{ backgroundColor: color.hexValue }}
					onClick={handleClick}
				>
					{isSelected && (
						<Check
							className={cn(
								checkSizes[size],
								isLight ? "text-foreground" : "text-white",
							)}
							strokeWidth={3}
						/>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>{color.displayName}</TooltipContent>
		</Tooltip>
	);
}

interface ColorSwatchRowProps {
	colors: Array<{
		id: string;
		hexValue: string;
		displayName: string;
	}>;
	totalColors: number;
	maxVisible?: number;
	className?: string;
	selectedColorId?: string;
	isSelectable?: boolean;
	swatchSize?: "xs" | "sm" | "md" | "lg";
	onColorSelect?: (colorId: string) => void;
}

export function ColorSwatchRow({
	colors,
	totalColors,
	maxVisible = 8,
	className,
	selectedColorId,
	isSelectable = false,
	onColorSelect,
	swatchSize = "md",
}: ColorSwatchRowProps) {
	const visibleColors = colors.slice(0, maxVisible);
	const remainingCount = totalColors - maxVisible;

	return (
		<div className={cn("flex items-center gap-1", className)}>
			{visibleColors.map((color) => (
				<ColorSwatch
					key={color.id}
					color={color}
					size={swatchSize}
					isSelected={selectedColorId === color.id}
					isSelectable={isSelectable}
					onSelect={onColorSelect}
				/>
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
