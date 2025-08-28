"use client";

import { useEffect } from "react";
import { trpc } from "@/trpc/client";
import { useEditorStore } from "../../store/editor-store";
import EditorSidebar from "../components/editor/editor-sidebar";
import { EditorCanvas } from "../components/editor/editor-canvas";
import EditorToolbar from "../components/editor/editor-toolbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditorViewProps {
  baseSkuId: string;
}

export default function EditorView({ baseSkuId }: EditorViewProps) {
  const {
    data: editorData,
    isLoading,
    error,
  } = trpc.baseSkus.getEditorData.useQuery({
    baseSkuId,
  });

  const { currentViewId, setCurrentView, resetEditor } = useEditorStore();

  // Initialize editor with first view when data loads
  useEffect(() => {
    if (editorData?.views.length && !currentViewId) {
      setCurrentView(editorData.views[0].id);
    }
  }, [editorData, currentViewId, setCurrentView]);

  // Reset editor when component unmounts
  useEffect(() => {
    return () => resetEditor();
  }, [resetEditor]);

  if (error || !editorData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Failed to load editor</h2>
          <p className="text-muted-foreground">
            {error?.message || "Unable to load editor data"}
          </p>
          <Button asChild>
            <Link href="/creator/dashboard">
              <ArrowLeft className="size-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentView = editorData.views.find((v) => v.id === currentViewId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Editor */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 relative">
          {currentView ? (
            <>
              <EditorCanvas
                view={currentView}
                baseSku={editorData.baseSku}
                colors={editorData.colors}
              />
              <EditorToolbar views={editorData.views} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                No views available for this product
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <EditorSidebar
          colors={editorData.colors}
          baseCost={editorData.baseSku.cost}
        />
      </div>
    </div>
  );
}
