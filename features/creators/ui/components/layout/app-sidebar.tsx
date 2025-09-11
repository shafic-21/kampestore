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

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	// products: {
	//   title: "Products",
	//   items: [
	//     {
	//       title: "Add Single Product",
	//       url: "/seller-center/products/add",
	//       icon: PackagePlus,
	//       isActive: false,
	//     },
	//     {
	//       title: "Bulk Upload",
	//       url: "/seller-center/products/bulk-upload",
	//       icon: ArchiveRestore,
	//       isActive: false,
	//     },
	//     {
	//       title: "Products List",
	//       url: "/seller-center/products",
	//       icon: GalleryVerticalEnd,
	//       isActive: false,
	//     },
	//   ],
	// },
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

	// secondNav: {
	//   title: null,
	//   items: [
	//     {
	//       title: "Performance",
	//       url: "/creator/performance",
	//       icon: ChartLine,
	//       isActive: false,
	//     },
	//     {
	//       title: "Finance",
	//       url: "/creator/finance",
	//       icon: CreditCard,
	//       isActive: false,
	//     },
	//     {
	//       title: "Customise Store",
	//       url: "/seller-center/customise-store",
	//       icon: PencilRuler,
	//       isActive: false,
	//     },
	//   ],
	// },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<Link href="#" className="flex items-start gap-2 text-primary">
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
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.firstNav} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
