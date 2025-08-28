import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getQueryClient, trpc, HydrateClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { BaseSelectionView } from "@/features/creators/ui/views/base-selection-view";
import { ErrorBoundary } from "react-error-boundary";

interface SearchParams {
  q?: string;
  category?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductSelectionPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const Headers = await headers();

  // Check authentication
  const session = await auth.api.getSession({
    headers: Headers,
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const creator = await trpc.creators.getMyCreatorProfile();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  // Parse search parameters
  const filters = {
    query: params.q || "",
    category: params.category,
    page: parseInt(params.page || "1", 10),
    limit: 20,
  };

  // Prefetch product selection data
  const queryClient = getQueryClient();
  await trpc.baseSkus.listBaseProducts.prefetch(filters);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>Error</div>}>
        <BaseSelectionView />
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
