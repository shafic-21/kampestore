"use client";

import { useEffect } from "react";
import { useEditorStore } from "../../../store/editor-store";
import { trpc } from "@/trpc/client";

interface EditorProviderProps {
  children: React.ReactNode;
  baseSkuId: string;
}

/**
 * EditorProvider Component
 * 
 * This provider component initializes the editor with database data and provides
 * centralized data management for all editor components. It connects to the
 * Zustand store and ensures all child components have access to editor data.
 * 
 * ARCHITECTURE:
 * - Fetches editor data from database using tRPC
 * - Initializes the editor store with fetched data
 * - Sets up default color selections (first color as featured)
 * - Provides loading and error states
 * 
 * DATA FLOW:
 * 1. Component mounts and fetches editor data for baseSkuId
 * 2. Store is populated with product info, views, and available colors
 * 3. Default selections are made (featured color, selected colors)
 * 4. Child components consume data from the store
 */
export function EditorProvider({ children, baseSkuId }: EditorProviderProps) {
  // Get store actions for initialization
  const initializeEditor = useEditorStore((state) => state.initializeEditor);
  const setSelectedColors = useEditorStore((state) => state.setSelectedColors);
  const setFeaturedColor = useEditorStore((state) => state.setFeaturedColor);
  const setCurrentProductColor = useEditorStore((state) => state.setCurrentProductColor);
  const editorData = useEditorStore((state) => state.editorData);

  // Fetch editor data from database
  const { data: fetchedData, isLoading, error } = trpc.baseSkus.getEditorData.useQuery({
    baseSkuId
  });

  // Initialize the editor with fetched data
  useEffect(() => {
    // Only initialize if we have data and haven't already initialized
    if (fetchedData && !editorData) {
      // Initialize the core editor data (views, base product, colors)
      initializeEditor(fetchedData);
      
      // Set up default color selections if colors are available
      if (fetchedData.colors.length > 0) {
        const defaultSelectedColors = [
          fetchedData.colors[0].id, // First available color
        ];
        
        // Set default selections in the store
        setSelectedColors(defaultSelectedColors);
        setFeaturedColor(fetchedData.colors[0].id); // First color as featured
        setCurrentProductColor(fetchedData.colors[0].id); // First color as current canvas color
      }
    }
  }, [fetchedData, editorData, initializeEditor, setSelectedColors, setFeaturedColor, setCurrentProductColor]);

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          Failed to load editor data: {error.message}
        </div>
      </div>
    );
  }

  // Show loading state while fetching or initializing
  if (isLoading || !editorData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  // Render children once editor is initialized
  return <>{children}</>;
}