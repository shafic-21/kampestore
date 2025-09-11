import { AppSidebar } from "@/features/creators/ui/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function CreatorLayout({
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
				<div className="max-w-screen">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
