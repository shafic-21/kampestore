"use client";

import dynamic from "next/dynamic";
import { EditorProvider } from "../components/editor/editor-provider";

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
 * Main view component for the product editor. This component serves as the
 * entry point for the editor and wraps all editor components with the EditorProvider
 * to ensure they have access to the shared editor state.
 * 
 * ARCHITECTURE:
 * - Wraps the editor with EditorProvider for centralized data management
 * - Dynamically loads the heavy canvas component for better performance
 * - Receives baseSkuId prop (currently unused, but will be used with tRPC later)
 * 
 * DATA FLOW:
 * 1. EditorProvider initializes editor with test data
 * 2. All child components access data through Zustand store
 * 3. Components manage state consistently across the entire editor
 * 
 * FUTURE: The baseSkuId will be passed to EditorProvider to fetch real
 * product data instead of using test data.
 */
export const EditorView = ({ baseSkuId }: EditorViewProps) => {
  return (
    <EditorProvider>
      <div className="h-full">
        <ProductEditor />
      </div>
    </EditorProvider>
  );
};
