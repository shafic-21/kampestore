"use client";

import { useEffect } from "react";
import { useEditorStore } from "../../../store/editor-store";
import type { EditorData } from "../../../types/canvas.types";

/**
 * Test data for the editor - will be replaced with tRPC calls later.
 * This contains all the product information needed to initialize the editor.
 */
const TEST_EDITOR_DATA: EditorData = {
  baseSku: {
    id: "990e8400-e29b-41d4-a716-446655440001",
    code: "classic-crew-neck-tee",
    name: "Classic Crew Neck T-Shirt",
  },
  views: [
    {
      id: "991e8400-e29b-41d4-a716-446655440001",
      code: "front",
      displayName: "Front",
      order: 1,
      sourceWidthPx: 900, // Original mockup size
      sourceHeightPx: 900, // Original mockup size
      mockupImageUrl: `https://files.xapisoft.co/apparel/product_template_classic-crew-neck-tee_front.png`,
      printArea: {
        id: "pa-front-001",
        base_sku_id: "990e8400-e29b-41d4-a716-446655440001",
        view_id: "991e8400-e29b-41d4-a716-446655440001",
        x_px: 282,
        y_px: 227,
        width_px: 336,
        height_px: 447,
        source_width_px: 900,
        source_height_px: 900,
        dpi: 300,
      },
    },
    {
      id: "991e8400-e29b-41d4-a716-446655440002",
      code: "back",
      displayName: "Back",
      order: 2,
      sourceWidthPx: 900,
      sourceHeightPx: 900,
      mockupImageUrl:
        "https://files.xapisoft.co/apparel/product_template_classic-crew-neck-tee_back.png",
      printArea: {
        id: "pa-back-001",
        base_sku_id: "990e8400-e29b-41d4-a716-446655440001",
        view_id: "991e8400-e29b-41d4-a716-446655440002",
        x_px: 277,
        y_px: 160,
        width_px: 349,
        height_px: 465,
        source_width_px: 900,
        source_height_px: 900,
        dpi: 300,
      },
    },
  ],
  colors: [
    // All available colors for classic-crew-neck-tee from database
    {
      id: "9280f039-b539-4a72-ae21-f7e58949bfbb",
      hexColor: "#1A1A1A",
      displayName: "Black",
    },
    {
      id: "3257f94d-a07e-4380-969f-72c619fc61f2",
      hexColor: "#0A1339",
      displayName: "Navy",
    },
    {
      id: "d149fb50-6275-4288-88f4-69672ce8d62a",
      hexColor: "#3A4B98",
      displayName: "Deep Royal",
    },
    {
      id: "c051eaec-0702-49a2-80c7-2e80ce1d552a",
      hexColor: "#9F0010",
      displayName: "Deep Red",
    },
    {
      id: "c760adb7-59f5-4e0d-b745-dcdd2c94260a",
      hexColor: "#134523",
      displayName: "Deep Forest",
    },
    {
      id: "6b20ffc0-1894-41a0-9a05-7053bb67a99d",
      hexColor: "#4B256E",
      displayName: "Purple",
    },
    {
      id: "c5de4ffc-448a-40ee-bab2-0f284a88b701",
      hexColor: "#F490B6",
      displayName: "Pink",
    },
    {
      id: "6b5bedc9-71cd-43f0-af47-7b918c836434",
      hexColor: "#5C739C",
      displayName: "Denim Blue",
    },
    {
      id: "9ce4d953-0e36-4ae5-be24-d8f4287708e9",
      hexColor: "#3F3F38",
      displayName: "Smoke Gray",
    },
    {
      id: "f8e07b2c-bd04-4e34-8d77-8ae5e112416c",
      hexColor: "#FFC4C4",
      displayName: "Pale Pink",
    },
    {
      id: "4f02a712-43b4-4f78-b09c-9de5e75580f9",
      hexColor: "#D6D5D5",
      displayName: "Light Steel",
    },
  ],
};

interface EditorProviderProps {
  children: React.ReactNode;
}

/**
 * EditorProvider Component
 * 
 * This provider component initializes the editor with test data and provides
 * centralized data management for all editor components. It connects to the
 * Zustand store and ensures all child components have access to editor data.
 * 
 * ARCHITECTURE:
 * - Initializes the editor store with test data on mount
 * - Sets up default color selections (first color as featured)
 * - Provides loading state while initialization happens
 * 
 * DATA FLOW:
 * 1. Component mounts and initializes editor with test data
 * 2. Store is populated with product info, views, and available colors
 * 3. Default selections are made (featured color, selected colors)
 * 4. Child components consume data from the store
 * 
 * FUTURE: This test data will be replaced with tRPC calls that fetch
 * real product data based on the baseSkuId parameter.
 */
export function EditorProvider({ children }: EditorProviderProps) {
  // Get store actions for initialization
  const initializeEditor = useEditorStore((state) => state.initializeEditor);
  const setSelectedColors = useEditorStore((state) => state.setSelectedColors);
  const setFeaturedColor = useEditorStore((state) => state.setFeaturedColor);
  const setCurrentProductColor = useEditorStore((state) => state.setCurrentProductColor);
  const editorData = useEditorStore((state) => state.editorData);

  // Initialize the editor with test data on mount
  useEffect(() => {
    // Only initialize if not already initialized
    if (!editorData) {
      // Initialize the core editor data (views, base product, colors)
      initializeEditor(TEST_EDITOR_DATA);
      
      // Set up default color selections
      const defaultSelectedColors = [
        TEST_EDITOR_DATA.colors[0].id, // Black (first color)
      ];
      
      // Set default selections in the store
      setSelectedColors(defaultSelectedColors);
      setFeaturedColor(TEST_EDITOR_DATA.colors[0].id); // Black as featured
      setCurrentProductColor(TEST_EDITOR_DATA.colors[0].id); // Black as current canvas color
    }
  }, [editorData, initializeEditor, setSelectedColors, setFeaturedColor, setCurrentProductColor]);

  // Show loading state while initializing
  if (!editorData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Initializing editor...</div>
      </div>
    );
  }

  // Render children once editor is initialized
  return <>{children}</>;
}