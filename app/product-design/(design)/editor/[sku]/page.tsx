import { ProductEditorView } from "@/features/product-design/ui/views/product-editor-view";

interface EditorPageProps {
  params: Promise<{
    sku: string;
  }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { sku } = await params;
  return <ProductEditorView baseSkuId={sku} />;
}
