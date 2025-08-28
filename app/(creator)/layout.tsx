import { AppSidebar } from "@/features/creators/ui/components/layout/app-sidebar";
import { SiteHeader } from "@/features/creators/ui/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function SellerCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 56)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="w-screen  max-w-7xl mx-auto flex flex-1 flex-col gap-2 px-8 ">
            {/* <SectionCards /> */}
            {children}
            {/* <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div> */}
            {/* <DataTable data={data} /> */}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
