import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EditStoreView } from "@/features/creators/ui/views/edit-store-view";
import { auth } from "@/server/auth";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function Page() {
	// Check authentication
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/sign-in");
	}

	const queryClient = getQueryClient();

	// Prefetch with React Query
	await trpc.creators.getMyCreatorProfile.prefetch();

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<EditStoreView />
		</HydrationBoundary>
	);
}
