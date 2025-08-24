"use client"

import * as React from "react"
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
  PieChart,
  Settings2,
  ShoppingCart,
  SquareTerminal,
} from "lucide-react";


import { NavMain } from "@/features/seller/components/layout/nav-main"

import { NavUser } from "@/features/seller/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import Image from "next/image"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  products: {
    title: "Products",
    items: [
      {
        title: "Add Single Product",
        url: "/seller-center/products/add",
        icon: PackagePlus,
        isActive: false,
      },
      {
        title: "Bulk Upload",
        url: "/seller-center/products/bulk-upload",
        icon: ArchiveRestore,
        isActive: false,
      },
      {
        title: "Products List",
        url: "/seller-center/products",
        icon: GalleryVerticalEnd,
        isActive: false,
      },
    ],
  },
  firstNav: {
    title: null,
    items: [
      {
        title: "Dashboard",
        url: "/seller-center/dashboard",
        icon: Home,
        isActive: true,
      },
      {
        title: "Orders",
        url: "/seller-center/orders",
        icon: ShoppingCart,
        isActive: false,
      },
    ],
  },

  secondNav: {
    title: null,
    items: [
      {
        title: "Performance",
        url: "/seller-center/performance",
        icon: ChartLine,
        isActive: false,
      },
      {
        title: "Finance",
        url: "/seller-center/finance",
        icon: CreditCard,
        isActive: false,
      },
      {
        title: "Customise Store",
        url: "/seller-center/customise-store",
        icon: PencilRuler,
        isActive: false,
      },
    ],
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 h-fit"
            >
              <Link href="#" className="flex items-start gap-2 text-primary">
                <Image
                  height={40}
                  width={100}
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/header-logo-alt-Dr3acTuTzOFvbsrX0CCmz87aZHQumK.svg"
                  alt="Kampe marketplace logo"
                  className="object-fit h-8 w-auto"
                />
                <span className="text-sm font-bold">Seller Center</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.firstNav} />
        <NavMain items={data.products} />
        <NavMain items={data.secondNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
