"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAutoHeader } from "@/features/seller/hooks/use-auto-header";
import { useHeaderStore } from "@/features/seller/stores/header-store";

export function SiteHeader() {
  useAutoHeader();
  // const { title, buttons } = useHeaderStore();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2  transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) fixed top-0 w-full">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        {/*<Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />*/}
        {/*<div className="ml-auto flex items-center gap-2">
          {buttons.map((b) => (
            <Button key={b.id} onClick={b.onClick}>
              {b.icon && <b.icon className="mr-2 h-4 w-4" />}
              {b.label}
            </Button>

          ))}
        </div>*/}
      </div>
    </header>
  );
}
