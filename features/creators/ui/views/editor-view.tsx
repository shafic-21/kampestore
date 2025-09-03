// /features/creators/ui/views/editor-view.tsx
"use client";
import dynamic from "next/dynamic";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { EditorProvider } from "../components/editor/editor-provider";
import { EditorSidePanel } from "../components/editor/editor-side-panel";

const ProductEditor = dynamic(
  () => import("../components/editor/editor-canvas"),
  {
    ssr: false,
    loading: () => <div>Loading Canvas...</div>,
  },
);

interface EditorViewProps {
  baseSkuId: string;
}

/**
 * EditorView Component
 *
 * Now includes the complete editor layout with sidebar inside EditorProvider.
 * This ensures the sidebar has access to initialized store data.
 */
export const EditorView = ({ baseSkuId }: EditorViewProps) => {
  return (
    <EditorProvider baseSkuId={baseSkuId}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 56)",
          } as React.CSSProperties
        }
      >
        <EditorSidePanel variant="inset" />
        <SidebarInset>
          <div className="h-full">
            <ProductEditor />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </EditorProvider>
  );
};
