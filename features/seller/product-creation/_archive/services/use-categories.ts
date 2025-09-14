import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const Category = z.object({
	id: z.string().uuid(),
	name: z.string(),
	slug: z.string(),
});
export type Category = z.infer<typeof Category>;

export function useCategories(search = "") {
	return useQuery({
		queryKey: ["categories", search],
		queryFn: async (): Promise<Category[]> => {
			const res = await fetch(
				`/api/catalog/categories?search=${encodeURIComponent(search)}`,
			);
			return Category.array().parse(await res.json());
		},
		staleTime: 5 * 60_000, // 5 min client cache
	});
}
