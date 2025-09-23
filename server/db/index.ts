import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as auth from "./schema/auth";
import * as waitlist from "./schema/waitlist";
import * as creators from "./schema/creators";
import * as catalog from "./schema/catalog";
import * as bases from "./schema/bases";
import * as products from "./schema/products";

const sql = neon(process.env.DATABASE_URL || "");
export const db = drizzle(sql, {
	schema: {
		...auth,
		...waitlist,
		...creators,
		...catalog,
		...bases,
		...products,
	},
});
