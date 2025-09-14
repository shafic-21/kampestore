"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	type RowSelectionState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import Image from "next/image";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ArrowUpDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { ProductRowActions } from "./product-row-actions";

import { useSellerOffersQuery } from "@/features/seller/offer-listing/services/use-seller-offer-query";
import { useUrlState } from "@/features/seller/hooks/use-url-state";
import type { ProductOffersQueryInput } from "@/features/seller/offer-listing/schemas/product-offers";
import { useProductsStore } from "@/features/seller/offer-listing/stores/products-store";
import type { Product as SellerProduct } from "@/features/seller/offer-listing/types/product";

const DEFAULT_PARAMS: ProductOffersQueryInput = {
	page: 1,
	pageSize: 10,
	sort: "createdAt",
	order: "desc",
};

function useTableParams() {
	return useUrlState(DEFAULT_PARAMS);
}

type Product = SellerProduct;

function mapApiToProduct(row: AwaitedReturn["data"][number]): Product {
	return {
		id: row.offerId,
		image: row.imageUrl ?? null,
		name: row.variantTitle || row.productTitle,
		sku: row.sellerSku,
		status: row.offerStatus,
		stock: row.stock,
		price: row.price,
		type: "offer",
		visibility: row.isVisible,
		lastUpdated: new Date(row.createdAt),
	};
}

export function ProductsTableClient() {
	const [params, setParams] = useTableParams();

	const { data, isFetching } = useSellerOffersQuery(params);
	const products = useMemo(
		() => (data ? data.data.map(mapApiToProduct) : []),
		[data],
	);

	const [sorting, _setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, _setRowSelection] = useState<RowSelectionState>({});

	const { setSelectedProducts } = useProductsStore();

	const safeSetSorting = useCallback(
		(updater: Parameters<typeof _setSorting>[0]) => {
			const next = typeof updater === "function" ? updater(sorting) : updater;
			_setSorting(next);

			if (next.length) {
				setParams((prev) => ({
					...prev,
					sort: next[0].id as ProductOffersQueryInput["sort"],
					order: next[0].desc ? "desc" : "asc",
					page: 1,
				}));
			}
		},
		[sorting, setParams],
	);

	const safeSetRowSelection = useCallback(
		(updater: Parameters<typeof _setRowSelection>[0]) => {
			const next =
				typeof updater === "function" ? updater(rowSelection) : updater;
			_setRowSelection(next);

			const ids = Object.entries(next)
				.filter(([, selected]) => selected)
				.map(([index]) => products[Number(index)]?.id)
				.filter(Boolean) as string[];

			setSelectedProducts(ids);
		},
		[rowSelection, products, setSelectedProducts],
	);

	const columns = useMemo<ColumnDef<Product>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(v) => row.toggleSelected(!!v)}
						aria-label="Select row"
					/>
				),
				enableSorting: false,
			},
			{
				accessorKey: "image",
				header: "Image",
				cell: ({ row }) => (
					<div className="w-[50px]">
						<Image
							src={"/placeholder.svg"}
							alt={row.original.name}
							width={50}
							height={50}
							className="rounded-md object-cover"
						/>
					</div>
				),
				enableSorting: false,
			},
			{
				accessorKey: "name",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="hover:bg-transparent"
					>
						Product Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<div className="font-medium">{row.original.name}</div>
				),
			},
			{
				accessorKey: "sku",
				header: "SKU",
				enableSorting: false,
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => (
					<Badge variant={getStatusBadgeVariant(row.original.status)}>
						{row.original.status}
					</Badge>
				),
				enableSorting: false,
			},
			{
				accessorKey: "stock",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="hover:bg-transparent"
					>
						Available
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
			},
			{
				accessorKey: "price",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="hover:bg-transparent"
					>
						Price (UGX)
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
			},
			{
				id: "actions",
				cell: ({ row }) => <ProductRowActions product={row.original} />,
			},
		],
		[],
	);

	/* react-table instance */
	const table = useReactTable({
		data: products,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		onSortingChange: safeSetSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: safeSetRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
		pageCount: Math.ceil((data?.total ?? 0) / params.pageSize),
	});

	/* virtualisation */
	const tableContainerRef = useRef<HTMLDivElement>(null);
	const { rows } = table.getRowModel();

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		estimateSize: () => 60,
		getScrollElement: () => tableContainerRef.current,
		overscan: 10,
	});

	const virtualRows = rowVirtualizer.getVirtualItems();
	const totalSize = rowVirtualizer.getTotalSize();
	const paddingTop = virtualRows[0]?.start ?? 0;
	const paddingBottom =
		totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0);

	/* pagination helpers */
	const totalPages = Math.ceil((data?.total ?? 0) / params.pageSize);
	const gotoPage = (p: number) => setParams((prev) => ({ ...prev, page: p }));

	/* render */
	return (
		<div className="space-y-4">
			{Object.keys(rowSelection).length > 0 && (
				<BulkActionsToolbar selectedCount={Object.keys(rowSelection).length} />
			)}

			<div className="rounded-md border">
				<div
					ref={tableContainerRef}
					className="relative max-h-[600px] overflow-auto"
				>
					<Table>
						<TableHeader className="sticky top-0 z-10 bg-muted">
							{table.getHeaderGroups().map((hg) => (
								<TableRow key={hg.id}>
									{hg.headers.map((h) => (
										<TableHead key={h.id} className="bg-muted">
											{h.isPlaceholder
												? null
												: flexRender(h.column.columnDef.header, h.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>

						<TableBody>
							{paddingTop > 0 && (
								<tr>
									<td style={{ height: `${paddingTop}px` }} />
								</tr>
							)}

							{virtualRows.map((vr) => {
								const row = rows[vr.index];
								return (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								);
							})}

							{paddingBottom > 0 && (
								<tr>
									<td style={{ height: `${paddingBottom}px` }} />
								</tr>
							)}

							{rows.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										{isFetching ? "Loading…" : "No products found."}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{/* footer */}
				<div className="flex items-center justify-between border-t px-4 py-4">
					<div className="text-sm text-muted-foreground">
						Showing{" "}
						<span className="font-medium">
							{products.length > params.pageSize
								? params.pageSize
								: products.length}
						</span>{" "}
						of <span className="font-medium">{data?.total ?? 0}</span> products
					</div>

					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => gotoPage(1)}
							disabled={params.page === 1}
						>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => gotoPage(params.page - 1)}
							disabled={params.page === 1}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>

						<span className="text-sm font-medium">
							Page {params.page} of {Math.max(totalPages, 1)}
						</span>

						<Button
							variant="outline"
							size="icon"
							onClick={() => gotoPage(params.page + 1)}
							disabled={params.page >= totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => gotoPage(totalPages)}
							disabled={params.page >= totalPages}
						>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

/* badge colour helper */
function getStatusBadgeVariant(status: string) {
	switch (status) {
		case "active":
			return "success";
		case "out_of_stock":
			return "warning";
		case "paused":
			return "destructive";
		case "pending_approval":
			return "info";
		default:
			return "outline";
	}
}

/* API return type */
type AwaitedReturn = {
	data: {
		offerId: string;
		productTitle: string;
		variantTitle: string;
		sellerSku: string | null;
		price: string;
		stock: number;
		offerStatus: string;
		isVisible: boolean;
		imageUrl: string | null;
		createdAt: string;
	}[];
	page: number;
	pageSize: number;
	total: number;
};
