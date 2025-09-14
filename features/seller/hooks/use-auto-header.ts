import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
	HeaderButton,
	useHeaderStore,
} from "@/features/seller/stores/header-store";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function useAutoHeader() {
	const router = useRouter();

	const headerMap: Record<string, { title: string; buttons?: HeaderButton[] }> =
		{
			"/": { title: "Dashboard" },
			"/seller-center/products": {
				title: "Products",
				buttons: [
					{
						id: "add",
						label: "Add New Product",
						onClick: () => {
							router.push("/seller-center/products/new");
						},
						icon: Plus,
					},
				],
			},
			"/orders": { title: "Orders" },
		};

	const pathname = usePathname();
	const setHeader = useHeaderStore((s) => s.setHeader);

	useEffect(() => {
		const cfg = headerMap[pathname] ?? headerMap["/"]; // fallback → dashboard
		setHeader(cfg.title, cfg.buttons);
	}, [pathname, setHeader]);
}
