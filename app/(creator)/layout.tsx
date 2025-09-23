"use client"

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/features/creators/ui/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function CreatorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/product-design/editor/")

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 56)",
					"--header-height": "calc(var(--spacing) * 16)",
					"backgroundColor":`${isEditor ? "var(--color-bg)" : ""}` as string
				} as React.CSSProperties
			}
			defaultOpen={!isEditor}
		>
			<AppSidebar variant="inset"/>
			<SidebarInset className={cn(isEditor && "bg-[#F6F6F9]")}>
				<div className="max-w-screen rounded-xl">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
