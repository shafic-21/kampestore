"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
	items,
}: {
	items: {
		title: string | null;
		items: {
			title: string;
			url: string;
			icon: LucideIcon;
			isActive: boolean;
		}[];
	};
}) {
	const pathname = usePathname();
	const { title, items: itemsArray } = items;
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				{title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
				<SidebarMenu>
					{itemsArray.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								tooltip={item.title}
								isActive={pathname === item.url}
							>
								<Link href={item.url}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
