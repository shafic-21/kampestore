import { SiteHeader } from "@/features/creators/ui/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { EditorSidePanel } from "@/features/creators/ui/components/editor/editor-side-panel";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 56)",
            "--header-height": "calc(var(--spacing) * 16)",
          } as React.CSSProperties
        }
      >
        <EditorSidePanel variant="inset" />
        <SidebarInset className="flex flex-col">
          <SiteHeader />
          <div className="flex-1 min-h-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
