import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { trpc } from "@/trpc/server";
import OnboardingView from "@/features/creators/ui/views/onboarding-view";

export default async function CreatorOnboardingPage() {
	// Check authentication
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/sign-in");
	}

	const existingCreator = await trpc.creators.getMyCreatorProfile();

	if (existingCreator) {
		redirect("/creator/dashboard");
	}

	return <OnboardingView user={session.user} />;
}
