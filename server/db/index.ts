// import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import * as auth from "./schema/auth";
import * as bases from "./schema/bases";
import * as catalog from "./schema/catalog";
import * as creators from "./schema/creators";
import * as products from "./schema/products";
import * as waitlist from "./schema/waitlist";

export const db = drizzle({
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true,
	},
	schema: {
		...auth,
		...waitlist,
		...creators,
		...catalog,
		...bases,
		...products,
	},
});

// const sql = neon(process.env.DATABASE_URL || "");
// export const db = drizzle(sql, {
// 	schema: {
// 		...auth,
// 		...waitlist,
// 		...creators,
// 		...catalog,
// 		...bases,
// 		...products,
// 	},
// });
