// features/seller/product-creation/store/ProductCreationProvider.tsx
"use client";

import { useEffect } from "react";
import { useCatalogCreationStore } from "./use-catalog-creation-store";

interface ProductCreationProviderProps {
	children: React.ReactNode;
	mode: "create" | "edit";
	creationType: "full-product" | "offer-only";
	catalogProductId?: string;
	offerId?: string;
}

export function ProductCreationProvider({
	children,
	mode,
	creationType,
	catalogProductId,
	offerId,
}: ProductCreationProviderProps) {
	const { setMode, setCatalogProductId, generateDraftId, reset } =
		useCatalogCreationStore();

	useEffect(() => {
		// Initialize store with props
		setMode(mode, creationType);
		setCatalogProductId(catalogProductId);

		generateDraftId();

		// Cleanup on unmount
		return () => {
			if (mode === "create") {
				reset();
			}
		};
	}, [
		mode,
		creationType,
		catalogProductId,
		offerId,
		setMode,
		setCatalogProductId,

		generateDraftId,
		reset,
	]);

	return <>{children}</>;
}
