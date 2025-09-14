import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function ProductsTableSkeleton() {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[40px]"></TableHead>
						<TableHead className="w-[80px]">Image</TableHead>
						<TableHead>Product Name</TableHead>
						<TableHead>SKU</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Available</TableHead>
						<TableHead>Price (UGX)</TableHead>
						<TableHead className="w-[70px]">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 5 }).map((_, index) => (
						<TableRow key={index}>
							<TableCell>
								<Skeleton className="h-4 w-4 rounded-sm" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-[50px] w-[50px] rounded-md" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[180px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[100px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[80px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[40px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[80px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-8 w-8 rounded-full" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<div className="flex items-center justify-between border-t px-4 py-4">
				<Skeleton className="h-5 w-[200px]" />
				<div className="flex items-center space-x-2">
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-5 w-[100px]" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
				</div>
			</div>
		</div>
	);
}
