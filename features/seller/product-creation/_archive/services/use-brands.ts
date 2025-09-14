import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const Brand = z.object({
	id: z.string().uuid(),
	name: z.string(),
	slug: z.string(),
});
export type Brand = z.infer<typeof Brand>;

export function useBrands(search = "") {
	return useQuery({
		queryKey: ["brands", search],
		queryFn: async (): Promise<Brand[]> => {
			const res = await fetch(
				`/api/catalog/brands?search=${encodeURIComponent(search)}`,
			);
			return Brand.array().parse(await res.json());
		},
		staleTime: 5 * 60_000, // 5 min client cache
	});
}
