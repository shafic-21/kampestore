"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { trpc } from "@/trpc/client";
import { useProductDesignStore } from "../../store";
import { transformToCache } from "../../utils/transform-cache";
import { EditorSidePanel } from "../components/editor-side-panel";

const ProductEditor = dynamic(() => import("../components/editor-canvas"), {
  ssr: false,
  loading: () => <div>Loading Canvas...</div>,
});

interface ProductEditorViewProps {
  baseSkuId: string;
  initialSkuId: string;
  isEditMode: boolean;
}

export function ProductEditorView({
  baseSkuId,
  initialSkuId,
  isEditMode
}: ProductEditorViewProps) {
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

  const prefetchCatalogProducts = useProductDesignStore(
    (state) => state.prefetchCatalogProducts,
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

  useEffect(() => {
    if (currentBaseSkuId === baseSkuId && cachedProduct) {
      const timer = setTimeout(() => {
        console.log("Prefetching catalog products in background...");
        prefetchCatalogProducts();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentBaseSkuId, baseSkuId, cachedProduct, prefetchCatalogProducts]);

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
      className="min-h-0 h-full"
    >
      <EditorSidePanel variant="inset" />
      <SidebarInset className="bg-transparent">
        {/*<div className="h-full">*/}
        <ProductEditor
          initialSkuId={initialSkuId}
          isEditMode={isEditMode}
        />
        {/*</div>*/}
      </SidebarInset>
    </SidebarProvider>
  );
}
