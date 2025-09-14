"use client";

import * as React from "react";
import {
	ArchiveRestore,
	AudioWaveform,
	BookOpen,
	Bot,
	ChartLine,
	Command,
	CreditCard,
	Frame,
	GalleryVerticalEnd,
	Home,
	Map,
	Package,
	PackagePlus,
	PencilRuler,
	PenTool,
	PieChart,
	Settings2,
	ShoppingCart,
	SquareTerminal,
} from "lucide-react";

import { NavMain } from "./nav-main";

import { NavUser } from "./nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	sidebarMenuButtonVariants,
	SidebarMenuItem,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},

	firstNav: {
		title: null,
		items: [
			{
				title: "Dashboard",
				url: "/creator/dashboard",
				icon: Home,
				isActive: true,
			},
			{
				title: "Orders",
				url: "/creator/orders",
				icon: ShoppingCart,
				isActive: false,
			},
			{
				title: "Products List",
				url: "/creator/products",
				icon: GalleryVerticalEnd,
				isActive: false,
			},
			{
				title: "Earnings",
				url: "/creator/finance",
				icon: CreditCard,
				isActive: false,
			},
		],
	},

};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
 const pathname = usePathname();
  const isEditor = pathname.includes("/product-design/editor/")

	return (
		<Sidebar collapsible="icon" {...props} className={cn(isEditor && "bg-background")}>
			<SidebarHeader className={cn(isEditor && "bg-background")}>
				<SidebarMenu >
					<SidebarMenuItem className="flex gap-2">
						{!isCollapsed && <Link href="#" className="flex items-start gap-2 text-primary flex-1">
							<Image
								height={40}
								width={100}
								src={
									isCollapsed
										? "/logo/logo-mark-primary.svg"
										: "/logo/full-logo-black.svg"
								}
								alt="Kampe marketplace logo"
								className={`object-fit h-6 w-auto`}
							/>
						</Link>}
						<SidebarTrigger className="flex-shrink-0" />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent className={cn(isEditor && "bg-background")}>
				<NavMain items={data.firstNav} />
			</SidebarContent>
			<SidebarFooter className={cn(isEditor && "bg-background")}>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
