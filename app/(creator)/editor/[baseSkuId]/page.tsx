import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { EditorView } from "@/features/creators/ui/views/editor-view";
import { headers } from "next/headers";
import { trpc, getQueryClient } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

interface PageProps {
  params: Promise<{ baseSkuId: string }>;
}

export default async function EditorPage({ params }: PageProps) {
  const { baseSkuId } = await params;

  const Headers = await headers();

  const session = await auth.api.getSession({
    headers: Headers,
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const queryClient = getQueryClient();

  // Prefetch editor data on the server
  await trpc.baseSkus.getEditorData.prefetch({ baseSkuId });

  return (
    // <HydrationBoundary state={dehydrate(queryClient)}>
    <EditorView baseSkuId={baseSkuId} />
    // </HydrationBoundary>
  );
}
