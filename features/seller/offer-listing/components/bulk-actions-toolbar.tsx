"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProductsStore } from "@/features/seller/offer-listing/stores/products-store";

export function BulkActionsToolbar({
	selectedCount,
}: {
	selectedCount: number;
}) {
	const [alertOpen, setAlertOpen] = useState(false);
	const [alertAction, setAlertAction] = useState<
		"delete" | "deactivate" | null
	>(null);
	const { selectedProducts, clearSelectedProducts } = useProductsStore();

	const handleBulkHideShow = () => {
		console.log("Bulk hide/show for products:", selectedProducts);
		// In a real app, this would call an API to perform the action
		clearSelectedProducts();
	};

	const handleBulkDeactivate = () => {
		setAlertAction("deactivate");
		setAlertOpen(true);
	};

	const handleBulkDelete = () => {
		setAlertAction("delete");
		setAlertOpen(true);
	};

	const handleBulkExport = () => {
		console.log("Exporting products:", selectedProducts);
		// In a real app, this would generate and download a CSV file
	};

	const confirmAction = () => {
		if (alertAction === "delete") {
			console.log("Bulk delete for products:", selectedProducts);
		} else if (alertAction === "deactivate") {
			console.log("Bulk deactivate for products:", selectedProducts);
		}

		// In a real app, this would call an API to perform the action
		clearSelectedProducts();
		setAlertOpen(false);
	};

	return (
		<>
			<div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-2">
				<div className="text-sm font-medium">
					{selectedCount} {selectedCount === 1 ? "product" : "products"}{" "}
					selected
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleBulkHideShow}>
						Hide / Show
					</Button>
					<Button variant="outline" size="sm" onClick={handleBulkDeactivate}>
						Deactivate
					</Button>
					<Button variant="outline" size="sm" onClick={handleBulkExport}>
						Export CSV
					</Button>
					<Button variant="destructive" size="sm" onClick={handleBulkDelete}>
						Delete
					</Button>
				</div>
			</div>

			<AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{alertAction === "delete"
								? "Delete Products"
								: "Deactivate Products"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{alertAction === "delete"
								? `Are you sure you want to delete ${selectedCount} ${
										selectedCount === 1 ? "product" : "products"
									}? This action cannot be undone.`
								: `Are you sure you want to deactivate ${selectedCount} ${
										selectedCount === 1 ? "product" : "products"
									}? They will be hidden from the marketplace.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmAction}
							className={
								alertAction === "delete"
									? "bg-destructive hover:bg-destructive/90"
									: ""
							}
						>
							{alertAction === "delete" ? "Delete" : "Deactivate"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
