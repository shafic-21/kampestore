import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { createCaller } from "@/trpc/server";
import { headers } from "next/headers";
import { DashboardView } from "@/features/creators/ui/views/dashboard-view";
import type { DashboardData } from "@/features/creators/types";

export default async function CreatorDashboardPage() {
	const Headers = await headers();
	const session = await auth.api.getSession({
		headers: Headers,
	});

	if (!session) {
		redirect("/auth/sign-in");
	}

	const caller = createCaller();
	const creator = await caller.creators.getMyCreatorProfile();

	if (!creator) {
		redirect("/creator/onboarding");
	}

	// Mock dashboard data - in production this would come from database/API
	const dashboardData: DashboardData = {
		creator: {
			id: creator.id,
			storeName: creator.storeName,
			creatorSlug: creator.creatorSlug,
			firstName: session.user.name?.split(" ")[0] || "Creator",
			lastName: session.user.name?.split(" ")[1] || "",
			email: session.user.email || "",
			avatar: session.user.image || undefined,
			isActive: true,
		},
		stats: {
			totalEarnings: BigInt(0), // UGX as bigint
			totalOrders: 0,
			totalProducts: 0,
			storeViews: 0,
		},
		quickActions: [], // Will use default actions from component
		bestsellerProducts: [], // Will use mock data from component
		featuredArticles: [], // Will use mock data from component
	};

	return <DashboardView data={dashboardData} />;
}
