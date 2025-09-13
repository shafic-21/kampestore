import { ProductEditorView } from "@/features/product-design/ui/views/product-editor-view";

interface EditorPageProps {
	params: Promise<{
		sku: string[];
	}>;
}

export default async function EditorPage({ params }: EditorPageProps) {
	const { sku } = await params;

	// Parse the SKU parameters
	const editSku = sku[0];
	const initialSku = sku[1] || editSku; // If no initial SKU, this IS the initial
	const isEditMode = sku.length > 1;

	return (
		<ProductEditorView
			baseSkuId={editSku}
			initialSkuId={initialSku}
			isEditMode={isEditMode}
		/>
	);
}