"use client";

import { useRef } from "react";
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
import { useEditorStore } from "../../../store/editor-store";
import {
  createDesignElementFromImage,
  scalePrintAreaToCanvas,
} from "../../../lib/canvas-utils";
import type { EditorView } from "../../../types/editor.types";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { parseAsStringLiteral, useQueryState } from "nuqs";

export function EditorToolbar() {
  const [editorMode, setEditorMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["design", "preview"]).withDefault("design"),
  );
  const [editorView, setEditorView] = useQueryState(
    "view",
    parseAsStringLiteral(["front", "back"]).withDefault("front"),
  );

  return (
    <div className="bg-sidebar px-4 py-2 rounded-2xl w-fit shadow-2xl flex items-center gap-4">
      {editorMode == "design" && (
        <Button variant={"ghost"} className="flex">
          <ImageIcon className="size-4" /> upload design
        </Button>
      )}
      <Popover>
        <PopoverTrigger className={cn(buttonVariants({ variant: "ghost" }))}>
          Front <ChevronDownIcon className="size-3" />
        </PopoverTrigger>
        <PopoverContent className="w-fit">
          <ul className="flex flex-col">
            {[
              { label: "Front", value: "front" },
              { label: "Back", value: "back" },
            ].map((item) => (
              <li key={item.value}>
                <Button
                  variant={"ghost"}
                  className="flex items-center"
                  onClick={() => setEditorView(item.value as "front" | "back")}
                >
                  {item.value}
                  {editorView === item.value && (
                    <CheckIcon className="size-3" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      <div className="bg-accent rounded-xl flex">
        <Button
          variant={"ghost"}
          className={cn(
            "flex rounded-full text-muted-foreground/80 hover:text-muted-foreground",
            editorMode == "design" &&
              "bg-foreground text-background hover:bg-foreground hover:text-foregorund ",
          )}
          onClick={() => setEditorMode("design")}
        >
          Design
        </Button>
        <Button
          variant={"ghost"}
          className={cn(
            "flex rounded-full text-muted-foreground hover:text-muted-foreground",
            editorMode == "preview" &&
              "bg-foreground text-background hover:bg-foreground hover:text-foregorund ",
          )}
          onClick={() => setEditorMode("preview")}
        >
          Preview
        </Button>
      </div>
    </div>
  );
}
