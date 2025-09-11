import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const ExitEditorButton = () => (
	<AlertDialog>
		<AlertDialogTrigger asChild className="w-full">
			<Button variant="outline">Back to dashboard</Button>
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>Your are about with unsaved changes</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. Your changes will not be saved and you
					will have to start over.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>Stay</AlertDialogCancel>
				<AlertDialogAction asChild>
					<Link
						href="/creator/dashboard"
						className={cn(buttonVariants({ variant: "destructive" }))}
					>
						Leave
					</Link>
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
);
