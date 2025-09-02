"use client";

// import { ProductEditor } from "../components/editor/editor-canvas";

import { trpc } from "@/trpc/client";
import type { EditorData } from "@/features/creators/types/editor.types";
import dynamic from "next/dynamic";

const ProductEditor = dynamic(
  () => import("../components/editor/editor-canvas"),
  {
    ssr: false,
    loading: () => <div>Loading Canvas...</div>,
  },
);

interface EditorViewProps {
  baseSkuId: string;
  initialData?: EditorData;
}

export const EditorView = ({ baseSkuId, initialData }: EditorViewProps) => {
  // const { data, isLoading, error } = trpc.baseSkus.getEditorData.useQuery(
  //   { baseSkuId },
  //   {
  //     initialData,
  //     staleTime: 1000 * 60 * 5, // 5 minutes
  //   },
  // );

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading editor...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (error || !data) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <p className="text-red-600 mb-2">Failed to load product data</p>
  //         <p className="text-gray-600 text-sm">
  //           {error?.message || "Please try again later"}
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="h-full">
      <ProductEditor />
    </div>
  );
};
