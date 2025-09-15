import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const creators = pgTable("creators", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  xUrl: text("x_url"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  tiktokUrl: text("tiktok_url"),
  displaySocialsOnStore: boolean("display_socials_on_store")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id")
    .notNull()
    .unique()
    .references(() => creators.id, { onDelete: "cascade" }),
  storeName: text("store_name").notNull(),
  storeSlug: text("store_slug").notNull().unique(),
  description: text("description"),
  logoR2Key: text("logo_r2_key"),
  bannerR2Key: text("banner_r2_key"),
  bannerAction: text("banner_action"),
  status: text("status", {
    enum: ["active", "draft", "suspended"],
  })
    .notNull()
    .default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storesRelations = relations(stores, ({ one }) => ({
  creator: one(creators, {
    fields: [stores.creatorId],
    references: [creators.id],
  }),
}));

export const creatorsRelations = relations(creators, ({ one }) => ({
  user: one(user, {
    fields: [creators.userId],
    references: [user.id],
  }),
  store: one(stores, {
    fields: [creators.id],
    references: [stores.creatorId],
  }),
}));
