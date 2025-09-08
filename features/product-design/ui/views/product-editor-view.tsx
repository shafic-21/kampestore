"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useProductDesignStore } from "../../store";
import { trpc } from "@/trpc/client";
import { EditorSidePanel } from "../components/editor-side-panel";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { transformToCache } from "../../utils/transform-cache";

const ProductEditor = dynamic(
  () => import("../components/editor-canvas"),
  {
    ssr: false,
    loading: () => <div>Loading Canvas...</div>,
  },
);

interface ProductEditorViewProps {
  baseSkuId: string;
}

export function ProductEditorView({ baseSkuId }: ProductEditorViewProps) {
  const cachedProduct = useProductDesignStore(
    (state) => state.bases.catalog[baseSkuId],
  );

  const {
    data: productData,
    error,
    isLoading,
  } = trpc.productDesign.initializeStore.useQuery(
    {
      sku: baseSkuId,
    },
    {
      enabled: !cachedProduct,
      staleTime: Infinity,
    },
  );

  // Get store actions for initialization
  const initializeEditor = useProductDesignStore(
    (state) => state.initializeEditor,
  );
  const updateProductCache = useProductDesignStore(
    (state) => state.updateProductCache,
  );
  const currentBaseSkuId = useProductDesignStore(
    (state) => state.editor.currentBaseSkuId,
  );

  useEffect(() => {
    if (productData && !cachedProduct) {
      updateProductCache([transformToCache(productData)]);
      initializeEditor(baseSkuId);
    } else if (cachedProduct && currentBaseSkuId !== baseSkuId) {
      initializeEditor(baseSkuId);
    }
  }, [
    productData,
    cachedProduct,
    baseSkuId,
    currentBaseSkuId,
    updateProductCache,
    initializeEditor,
  ]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Failed to load editor
          </div>
          <div className="text-muted-foreground">{error.message}</div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching or initializing
  if (
    isLoading ||
    (!cachedProduct && !productData) ||
    currentBaseSkuId !== baseSkuId
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Loading editor...</div>
          <div className="text-muted-foreground">
            Preparing your design workspace
          </div>
        </div>
      </div>
    );
  }

  // Render the complete editor interface
  return (
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
  );
}
