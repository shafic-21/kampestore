import { sql } from "drizzle-orm";
import { catalogProducts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { BasicInfoInput } from "../schemas/basic-info";

type Duplicate = { id: string; title: string };

export async function checkDuplicates(db: DB, input: BasicInfoInput) {
	if (input.gtin) {
		// await 🔑
		return (await db.query.catalogProducts.findMany({
			columns: { id: true, title: true },
			where: (p, { eq }) =>
				eq(p.gtin, input.gtin!) && eq(p.lifecycleStatus, "active"),
		})) as Duplicate[];
	}

	const res = await db.execute<Duplicate>(sql`
    SELECT id, title
    FROM catalog_products
    WHERE brand_id = ${input.brandId}
      AND similarity(title, ${input.title}) > 0.6
      AND lifecycle_status = 'active'
    ORDER BY similarity(title, ${input.title}) DESC
    LIMIT 5;
  `);

	return res.rows; // Duplicate[]
}
