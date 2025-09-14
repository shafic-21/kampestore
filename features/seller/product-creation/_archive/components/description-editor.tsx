"use client";

import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import {
	AlertCircle,
	Bold,
	Italic,
	List,
	ListOrdered,
	Heading2,
	Heading3,
	ImageIcon,
	LinkIcon,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	Undo,
	Redo,
	Pilcrow,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { toast } from "sonner";

import { useEditor, EditorContent, Editor, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

import { useCreationStore } from "@/features/seller/product-creation/_archive/store/use-creation-store";

interface ToolbarButtonProps {
	editor: Editor | null;
	onClick: () => void;
	isActive?: boolean;
	disabled?: boolean;
	tooltip: string;
	children: ReactNode;
}
const ToolbarButton: React.FC<ToolbarButtonProps> = ({
	editor,
	onClick,
	isActive,
	disabled = false,
	tooltip,
	children,
}) => (
	<TooltipProvider delayDuration={80}>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onClick}
					disabled={!editor || disabled || !editor.isEditable}
					className={cn("h-8 w-8 p-0", isActive && "bg-muted-foreground/20")}
					aria-label={tooltip}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	</TooltipProvider>
);

export interface DescriptionEditorProps {
	/** merchant id for uploads – feed from session */
	sellerId?: string;
	value?: JSONContent;
	onChange?: (value: JSONContent) => void;
	placeholder?: string;
	minHeight?: number;
	maxHeight?: number;
	readOnly?: boolean;
	error?: string;
	characterLimit?: number;
	className?: string;
}

export function DescriptionEditor({
	sellerId,
	value,
	onChange,
	placeholder = "Write a detailed description of your product…",
	minHeight = 300,
	maxHeight,
	readOnly = false,
	error,
	characterLimit,
	className,
}: DescriptionEditorProps) {
	/* ---------------------------------------------------------------------- */
	/*                       state & external data hooks                      */
	/* ---------------------------------------------------------------------- */

	const draftId = useCreationStore((s) => s.draftId); // ← comes from wizard
	const { theme } = useTheme();

	const [charCount, setCharCount] = useState(0);
	const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [linkText, setLinkText] = useState("");
	const imageFilePickerRef = useRef<HTMLInputElement>(null);

	/* ---------------------------------------------------------------------- */
	/*                           tiptap initialisation                        */
	/* ---------------------------------------------------------------------- */

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				strike: false,
				code: false,
				codeBlock: false,
				blockquote: false,
				horizontalRule: false,
				heading: { levels: [2, 3] },
			}),
			Image,
			Link.configure({
				openOnClick: false,
				autolink: true,
				linkOnPaste: true,
				HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
			}),
			Placeholder.configure({ placeholder }),
			TextAlign.configure({ types: ["heading", "paragraph"] }),
		],
		content: value,
		editable: !readOnly,
		onUpdate: ({ editor }) => {
			if (onChange) onChange(editor.getJSON());
			setCharCount(editor.getText().length);
		},
		editorProps: {
			attributes: {
				class: cn(
					"prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4",
					"min-h-[var(--min-h)]",
					maxHeight ? "max-h-[var(--max-h)] overflow-y-auto" : "",
				),
				style: `--min-h: ${minHeight}px; ${
					maxHeight ? `--max-h: ${maxHeight}px;` : ""
				}`,
			},
		},
	});

	/* keep external value in sync */
	useEffect(() => {
		if (editor && !editor.isDestroyed && value) {
			editor.commands.setContent(value, false);
		}
	}, [editor, value]);

	/* ---------------------------------------------------------------------- */
	/*                              image upload                              */
	/* ---------------------------------------------------------------------- */

	const insertImage = useCallback(
		(url: string) => editor?.chain().focus().setImage({ src: url }).run(),
		[editor],
	);

	const handleImageFileSelected = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			console.log("File selected", file);
			if (e.target) e.target.value = "";
			if (!file || !editor || !sellerId || !draftId) return;

			setIsUploadingImage(true);
			try {
				const apiUrl = `/api/upload/products/${sellerId}/${draftId}?context=editor`;
				const formData = new FormData();
				console.log("filleee", file);
				formData.append("files", file);

				console.log("Form data", formData);

				const res = await fetch(apiUrl, { method: "POST", body: formData });
				const json = await res.json();
				if (!res.ok) throw new Error(json.error);
				const uploadedUrl = json.url ?? json.uploads?.[0]?.url;
				if (uploadedUrl) {
					insertImage(uploadedUrl);
					toast.success("Image uploaded");
				} else throw new Error("No URL in response");
			} catch (err: any) {
				toast.error("Upload failed", { description: err.message });
			} finally {
				setIsUploadingImage(false);
			}
		},
		[sellerId, draftId, editor, insertImage],
	);

	const handleLinkInsert = useCallback(() => {
		if (!editor || !linkUrl) return;
		const cmd = editor.chain().focus();
		const attrs = {
			href: linkUrl,
			target: "_blank",
			rel: "noopener noreferrer",
		};
		if (linkText) {
			cmd
				.insertContent(
					`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`,
					{ parseOptions: { preserveWhitespace: false } },
				)
				.run();
		} else if (editor.state.selection.empty) {
			cmd.insertContent(linkUrl).run();
		} else {
			cmd.extendMarkRange("link").setLink(attrs).run();
		}
		setLinkUrl("");
		setLinkText("");
		setIsLinkDialogOpen(false);
	}, [editor, linkUrl, linkText]);

	/* ---------------------------------------------------------------------- */
	/*                               toolbar fns                              */
	/* ---------------------------------------------------------------------- */

	const toggle = (cb: () => void) => () => cb();

	/* ---------------------------------------------------------------------- */
	/*                                 render                                 */
	/* ---------------------------------------------------------------------- */

	if (!editor) return null;

	const disabledUpload = !sellerId || !draftId || isUploadingImage;

	return (
		<div className={cn("space-y-2", className)}>
			<input
				type="file"
				ref={imageFilePickerRef}
				onChange={handleImageFileSelected}
				accept="image/*"
				className="hidden"
			/>

			{/* wrapper */}
			<div
				className={cn(
					"border rounded-md overflow-hidden",
					error ? "border-destructive" : "border-muted-foreground/20",
					"focus-within:ring-2 focus-within:ring-ring/50",
				)}
			>
				{/* toolbar */}
				{!readOnly && (
					<div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 p-1">
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().setParagraph().run(),
							)}
							isActive={editor.isActive("paragraph")}
							tooltip="Paragraph"
						>
							<Pilcrow className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().toggleHeading({ level: 2 }).run(),
							)}
							isActive={editor.isActive("heading", { level: 2 })}
							tooltip="Heading 2"
						>
							<Heading2 className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().toggleHeading({ level: 3 }).run(),
							)}
							isActive={editor.isActive("heading", { level: 3 })}
							tooltip="Heading 3"
						>
							<Heading3 className="h-4 w-4" />
						</ToolbarButton>

						<div className="mx-1 h-6 w-px bg-border" />

						<ToolbarButton
							editor={editor}
							onClick={toggle(() => editor.chain().focus().toggleBold().run())}
							isActive={editor.isActive("bold")}
							tooltip="Bold"
						>
							<Bold className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().toggleItalic().run(),
							)}
							isActive={editor.isActive("italic")}
							tooltip="Italic"
						>
							<Italic className="h-4 w-4" />
						</ToolbarButton>

						<div className="mx-1 h-6 w-px bg-border" />

						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().toggleBulletList().run(),
							)}
							isActive={editor.isActive("bulletList")}
							tooltip="Bullet list"
						>
							<List className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().toggleOrderedList().run(),
							)}
							isActive={editor.isActive("orderedList")}
							tooltip="Numbered list"
						>
							<ListOrdered className="h-4 w-4" />
						</ToolbarButton>

						<div className="mx-1 h-6 w-px bg-border" />

						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().setTextAlign("left").run(),
							)}
							isActive={editor.isActive({ textAlign: "left" })}
							tooltip="Align left"
						>
							<AlignLeft className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().setTextAlign("center").run(),
							)}
							isActive={editor.isActive({ textAlign: "center" })}
							tooltip="Align center"
						>
							<AlignCenter className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().setTextAlign("right").run(),
							)}
							isActive={editor.isActive({ textAlign: "right" })}
							tooltip="Align right"
						>
							<AlignRight className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() =>
								editor.chain().focus().setTextAlign("justify").run(),
							)}
							isActive={editor.isActive({ textAlign: "justify" })}
							tooltip="Justify"
						>
							<AlignJustify className="h-4 w-4" />
						</ToolbarButton>

						<div className="mx-1 h-6 w-px bg-border" />

						<ToolbarButton
							editor={editor}
							onClick={() => imageFilePickerRef.current?.click()}
							disabled={disabledUpload}
							tooltip={
								disabledUpload ? "Save basic info first" : "Upload image"
							}
						>
							{isUploadingImage ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<ImageIcon className="h-4 w-4" />
							)}
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={() => setIsLinkDialogOpen(true)}
							tooltip="Insert link"
						>
							<LinkIcon className="h-4 w-4" />
						</ToolbarButton>

						<div className="mx-1 h-6 w-px bg-border" />

						<ToolbarButton
							editor={editor}
							onClick={toggle(() => editor.chain().focus().undo().run())}
							disabled={!editor.can().undo()}
							tooltip="Undo"
						>
							<Undo className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							editor={editor}
							onClick={toggle(() => editor.chain().focus().redo().run())}
							disabled={!editor.can().redo()}
							tooltip="Redo"
						>
							<Redo className="h-4 w-4" />
						</ToolbarButton>
					</div>
				)}

				{/* content */}
				<EditorContent editor={editor} />
			</div>

			{/* footer */}
			<div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
				<div className="flex items-center gap-1">
					<ImageIcon className="h-3 w-3 flex-shrink-0" />
					<span>Use toolbar to format description</span>
				</div>
				<span
					className={cn(
						characterLimit && charCount > characterLimit
							? "text-destructive font-medium"
							: "",
					)}
				>
					{charCount}
					{characterLimit ? ` / ${characterLimit}` : ""} characters
				</span>
			</div>
			{error && (
				<p className="flex items-center gap-1 px-1 text-sm text-destructive">
					<AlertCircle className="h-4 w-4" /> {error}
				</p>
			)}

			{/* link dialog */}
			<Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editor.isActive("link") ? "Edit link" : "Insert link"}
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<label htmlFor="link-url" className="text-sm font-medium">
								URL
							</label>
							<Input
								id="link-url"
								placeholder="https://example.com"
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleLinkInsert()}
							/>
						</div>
						<div className="grid gap-2">
							<label htmlFor="link-text" className="text-sm font-medium">
								Text (optional)
							</label>
							<Input
								id="link-text"
								placeholder="Link text"
								value={linkText}
								onChange={(e) => setLinkText(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleLinkInsert()}
							/>
							<p className="text-xs text-muted-foreground">
								Leave empty to use the selected text.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsLinkDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleLinkInsert}
							disabled={!linkUrl}
						>
							{editor.isActive("link") ? "Update" : "Insert"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default DescriptionEditor;
