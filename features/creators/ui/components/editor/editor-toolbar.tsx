"use client";

import { useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Upload,
	Eye,
	Edit3,
	RotateCcw,
	Image,
	ImageIcon,
	ChevronDownIcon,
	CheckIcon,
} from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEditorStore } from "@/features/creators/store/editor-store";
import { cn } from "@/lib/utils";

/**
 * EditorToolbar Component
 *
 * Provides controls for:
 * - Switching between design and preview modes (URL state via nuqs)
 * - Switching between product views (front/back) (URL state via nuqs)
 * - Uploading designs (triggers file input)
 *
 * This component demonstrates the separation of concerns:
 * - UI state (mode/view) stays in URL for shareability
 * - Complex state (designs) managed by Zustand
 */
interface EditorToolbarProps {
	/**
	 * Handler to trigger the file input for design upload.
	 * Passed from parent to maintain single source of truth for file input ref.
	 */
	handleDesignUpload: () => void;

	/**
	 * Reference to the file input element.
	 * Used to trigger file selection programmatically.
	 */
	fileInputRef: React.RefObject<HTMLInputElement | null>;

	/**
	 * Current design object from Zustand store.
	 * Used to show upload vs change design text.
	 */
	currentDesign: {
		image: HTMLImageElement | null;
		attrs: {
			x: number;
			y: number;
			width: number;
			height: number;
			rotation: number;
			scaleX: number;
			scaleY: number;
		};
		isSelected: boolean;
		printQuality: "Good" | "Fair" | "Poor";
	};
}

export function EditorToolbar({
	handleDesignUpload,
	fileInputRef,
	currentDesign,
}: EditorToolbarProps) {
	// ===== URL STATE (nuqs) =====
	/**
	 * Editor mode state (design/preview) stored in URL.
	 * This makes the mode shareable - someone can send a link in preview mode.
	 *
	 * parseAsStringLiteral creates a type-safe parser for specific string values.
	 * withDefault ensures we always have a valid value.
	 */
	const [editorMode, setEditorMode] = useQueryState(
		"mode",
		parseAsStringLiteral(["design", "preview"]).withDefault("design"),
	);

	/**
	 * Editor view state (front/back) stored in URL.
	 * Allows direct linking to specific product views.
	 */
	const [editorView, setEditorView] = useQueryState(
		"view",
		parseAsStringLiteral(["front", "back"]).withDefault("front"),
	);

	// Listing session presence from URL state (nuqs)
	const [listingId] = useQueryState("listingId", parseAsString.withDefault(""));

	// ===== ZUSTAND STORE =====
	/**
	 * Get editor data from Zustand store.
	 * We only need the views list to populate the dropdown.
	 */
	const editorData = useEditorStore((state) => state.editorData);
	const setCurrentView = useEditorStore((state) => state.setCurrentView);

	// Get available views from editor data
	const views = editorData?.views || [];

	// Simple handler - no useCallback needed
	const handleViewChange = (viewCode: "front" | "back") => {
		setEditorView(viewCode);
		const view = views.find((v) => v.code === viewCode);
		if (view) {
			setCurrentView(view.id);
		}
	};

	// Get current view display name for dropdown
	const currentViewName =
		views.find((v) => v.code === editorView)?.displayName || "Front";

	// Local state to control popover open/close for the view selector
	const [isViewPopoverOpen, setIsViewPopoverOpen] = useState(false);

	return (
		<div className=" z-10">
			<div className="bg-background border px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4">
				{/* Upload/Change Design Button - Only visible in design mode */}

				<Button
					variant="ghost"
					onClick={handleDesignUpload}
					className="flex items-center gap-2"
					disabled={editorMode == "preview" || Boolean(listingId)}
				>
					<ImageIcon className="size-4" />
					<span>
						{currentDesign?.image ? "Change Design" : "Upload Design"}
					</span>
				</Button>

				{/* View Selector Dropdown */}
				<Popover open={isViewPopoverOpen} onOpenChange={setIsViewPopoverOpen}>
					<PopoverTrigger className={cn(buttonVariants({ variant: "ghost" }))}>
						<span className="flex items-center gap-2">
							{currentViewName}
							<ChevronDownIcon className="size-3" />
						</span>
					</PopoverTrigger>
					<PopoverContent className="w-fit p-2">
						<ul className="flex flex-col gap-1">
							{views.map((view) => (
								<li key={view.id}>
									<Button
										variant="ghost"
										className={cn(
											"w-full justify-start flex items-center gap-2",
											editorView === view.code && "bg-accent",
										)}
										onClick={() => {
											handleViewChange(view.code as "front" | "back");
											setIsViewPopoverOpen(false);
										}}
									>
										<span>{view.displayName}</span>
										{editorView === view.code && (
											<CheckIcon className="size-3 ml-auto" />
										)}
									</Button>
								</li>
							))}
						</ul>
					</PopoverContent>
				</Popover>

				{/* Mode Toggle (Design/Preview) */}
				<div className="bg-accent rounded-xl flex p-1">
					<Button
						variant="ghost"
						className={cn(
							"rounded-full text-muted-foreground/80 hover:text-muted-foreground transition-all",
							editorMode === "design" && [
								"bg-foreground text-background",
								"hover:bg-foreground hover:text-background",
							],
						)}
						onClick={() => setEditorMode("design")}
					>
						<Edit3 className="size-3 mr-2" />
						Design
					</Button>
					<Button
						variant="ghost"
						className={cn(
							"rounded-full text-muted-foreground/80 hover:text-muted-foreground transition-all",
							editorMode === "preview" && [
								"bg-foreground text-background",
								"hover:bg-foreground hover:text-background",
							],
						)}
						onClick={() => setEditorMode("preview")}
					>
						<Eye className="size-3 mr-2" />
						Preview
					</Button>
				</div>

				{/* Additional Actions - Future features */}
				{/*
        <Separator orientation="vertical" className="h-6" />

        <Button variant="ghost" size="icon" title="Reset Design">
          <RotateCcw className="size-4" />
        </Button>
        */}
			</div>
		</div>
	);
}
