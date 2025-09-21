import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { StorePageView } from "@/features/store-front/ui/views/store-page-view";
import { getQueryClient, trpc } from "@/trpc/server";

interface PageProps {
	params: Promise<{
		slug: string;
	}>;
	searchParams: Promise<{
		search?: string;
		category?: string;
		page?: string;
	}>;
}

export default async function StorePage({ params, searchParams }: PageProps) {
	const { slug } = await params;
	const { search, category, page } = await searchParams;

	const queryClient = getQueryClient();

	// if (!store) {
	// 	console.log("hello");
	// 	notFound();
	// }

	// if (store.status !== "active") {
	// 	notFound();
	// }

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<StorePageView storeSlug={slug} />
		</HydrationBoundary>
	);
}

export async function generateMetadata({ params }: PageProps) {
	const { slug } = await params;

	const store = await trpc.storeFront.getStoreBySlug({ slug });

	if (!store) {
		return {
			title: "Store Not Found",
		};
	}

	return {
		title: `${store.storeName} - Kampe Store`,
		description:
			store.description ||
			`Shop custom products from ${store.storeName} on Kampe`,
		openGraph: {
			title: `${store.storeName} - Kampe Store`,
			description:
				store.description ||
				`Shop custom products from ${store.storeName} on Kampe`,
			type: "website",
		},
	};
}
