import { EditorView } from "@/features/creators/ui/views/editor-view";

interface EditorPageProps {
  params: {
    baseSkuId: string;
  };
}

export default function EditorPage({ params }: EditorPageProps) {
  return <EditorView baseSkuId={params.baseSkuId} />;
}
