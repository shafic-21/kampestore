"use client";

import type * as React from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDialogProps {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	modal?: boolean;
	shouldScaleBackground?: boolean;
}

interface ResponsiveTriggerProps {
	children: React.ReactNode;
	asChild?: boolean;
}

interface ResponsiveContentProps {
	children: React.ReactNode;
	className?: string;
	showCloseButton?: boolean;
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

function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return <Drawer {...props}>{children}</Drawer>;
	}

	return <Dialog {...props}>{children}</Dialog>;
}

function ResponsiveDialogTrigger({
	children,
	...props
}: ResponsiveTriggerProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
	}

	return <DialogTrigger {...props}>{children}</DialogTrigger>;
}

function ResponsiveDialogContent({
	children,
	className,
	showCloseButton = true,
	...props
}: ResponsiveContentProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerContent className={className} {...props}>
				<ScrollArea className="flex-1 h-full ">{children}</ScrollArea>
			</DrawerContent>
		);
	}

	return (
		<DialogContent
			className={className}
			showCloseButton={showCloseButton}
			{...props}
		>
			<ScrollArea className="flex-1">{children}</ScrollArea>
		</DialogContent>
	);
}

function ResponsiveDialogHeader({
	children,
	className,
	...props
}: ResponsiveHeaderProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerHeader className={className} {...props}>
				{children}
			</DrawerHeader>
		);
	}

	return (
		<DialogHeader className={className} {...props}>
			{children}
		</DialogHeader>
	);
}

function ResponsiveDialogFooter({
	children,
	className,
	...props
}: ResponsiveFooterProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerFooter className={className} {...props}>
				{children}
			</DrawerFooter>
		);
	}

	return (
		<DialogFooter className={className} {...props}>
			{children}
		</DialogFooter>
	);
}

function ResponsiveDialogTitle({
	children,
	className,
	...props
}: ResponsiveTitleProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerTitle className={className} {...props}>
				{children}
			</DrawerTitle>
		);
	}

	return (
		<DialogTitle className={className} {...props}>
			{children}
		</DialogTitle>
	);
}

function ResponsiveDialogDescription({
	children,
	className,
	...props
}: ResponsiveDescriptionProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerDescription className={className} {...props}>
				{children}
			</DrawerDescription>
		);
	}

	return (
		<DialogDescription className={className} {...props}>
			{children}
		</DialogDescription>
	);
}

function ResponsiveDialogClose({
	children,
	className,
	...props
}: ResponsiveCloseProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerClose className={className} {...props}>
				{children}
			</DrawerClose>
		);
	}

	return (
		<DialogClose className={className} {...props}>
			{children}
		</DialogClose>
	);
}

export {
	ResponsiveDialog,
	ResponsiveDialogTrigger,
	ResponsiveDialogContent,
	ResponsiveDialogHeader,
	ResponsiveDialogFooter,
	ResponsiveDialogTitle,
	ResponsiveDialogDescription,
	ResponsiveDialogClose,
};
