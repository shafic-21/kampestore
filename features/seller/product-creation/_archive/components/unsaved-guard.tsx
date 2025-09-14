"use client";
import { useEffect } from "react";
import { useCreationStore } from "@/features/seller/product-creation/_archive/store/use-creation-store";

/**
 * Pops a native `beforeunload` prompt if the current step
 * reports `unsavedChanges === true` via the Zustand store.
 *
 * Down-stream steps set `setUnsaved(true)` whenever a *dirty*
 * form exists; they must call `setUnsaved(false)` after a
 * successful server action.
 */
export default function UnsavedGuard() {
	const unsaved = useCreationStore((s) => s.unsavedChanges);

	useEffect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (!unsaved) return;
			e.preventDefault();
			e.returnValue = ""; // Chrome requires returnValue to be set.
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [unsaved]);

	return null; // No UI.
}
