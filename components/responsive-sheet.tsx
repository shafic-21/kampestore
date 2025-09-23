"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Sheet,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import {
	Drawer,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponsiveSheetProps {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	shouldScaleBackground?: boolean;
}

interface ResponsiveTriggerProps {
	children: React.ReactNode;
	asChild?: boolean;
}

interface ResponsiveContentProps {
	children: React.ReactNode;
	className?: string;
	side?: "top" | "right" | "bottom" | "left";
}

interface ResponsiveHeaderProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveFooterProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveTitleProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveDescriptionProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveCloseProps {
	children?: React.ReactNode;
	className?: string;
	asChild?: boolean;
}

function ResponsiveSheet({ children, ...props }: ResponsiveSheetProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return <Drawer {...props}>{children}</Drawer>;
	}

	return <Sheet {...props}>{children}</Sheet>;
}

function ResponsiveSheetTrigger({ children, ...props }: ResponsiveTriggerProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
	}

	return <SheetTrigger {...props}>{children}</SheetTrigger>;
}

function ResponsiveSheetContent({
	children,
	className,
	side = "right",
	...props
}: ResponsiveContentProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerContent className={className} {...props}>
				<ScrollArea className="flex-1">
					{children}
				</ScrollArea>
			</DrawerContent>
		);
	}

	return (
		<SheetContent side={side} className={className} {...props}>
			<ScrollArea className="flex-1">
				{children}
			</ScrollArea>
		</SheetContent>
	);
}

function ResponsiveSheetHeader({ children, className, ...props }: ResponsiveHeaderProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerHeader className={className} {...props}>
				{children}
			</DrawerHeader>
		);
	}

	return (
		<SheetHeader className={className} {...props}>
			{children}
		</SheetHeader>
	);
}

function ResponsiveSheetFooter({ children, className, ...props }: ResponsiveFooterProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerFooter className={className} {...props}>
				{children}
			</DrawerFooter>
		);
	}

	return (
		<SheetFooter className={className} {...props}>
			{children}
		</SheetFooter>
	);
}

function ResponsiveSheetTitle({ children, className, ...props }: ResponsiveTitleProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerTitle className={className} {...props}>
				{children}
			</DrawerTitle>
		);
	}

	return (
		<SheetTitle className={className} {...props}>
			{children}
		</SheetTitle>
	);
}

function ResponsiveSheetDescription({ children, className, ...props }: ResponsiveDescriptionProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerDescription className={className} {...props}>
				{children}
			</DrawerDescription>
		);
	}

	return (
		<SheetDescription className={className} {...props}>
			{children}
		</SheetDescription>
	);
}

function ResponsiveSheetClose({ children, className, ...props }: ResponsiveCloseProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerClose className={className} {...props}>
				{children}
			</DrawerClose>
		);
	}

	return (
		<SheetClose className={className} {...props}>
			{children}
		</SheetClose>
	);
}

export {
	ResponsiveSheet,
	ResponsiveSheetTrigger,
	ResponsiveSheetContent,
	ResponsiveSheetHeader,
	ResponsiveSheetFooter,
	ResponsiveSheetTitle,
	ResponsiveSheetDescription,
	ResponsiveSheetClose,
};