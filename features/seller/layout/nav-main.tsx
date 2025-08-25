"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LucideIcon } from "lucide-react";

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

   const { title, items: itemsArray } = items;
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
        <SidebarMenu>
          {itemsArray.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
