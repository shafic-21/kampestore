import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { trpc } from "@/trpc/server";
import { ProductSelectionView } from "@/features/products/ui/views/product-selection-view";

interface SearchParams {
  q?: string;
  category?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductSelectionPage({ searchParams }: PageProps) {
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

  // Fetch product selection data
  const data = await trpc.products.getProductSelectionData(filters);

  return <ProductSelectionView data={data} />;
}