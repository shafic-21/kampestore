import {
  pgTable,
  text,
  uuid,
  timestamp,
  bigint,
  json,
  integer,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { creators } from "./creators";
import { baseSkus, baseSkuViews } from "./bases";
import { attributes, attributeValues } from "./catalog";

export const creatorListings = pgTable(
  "creator_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id, { onDelete: "cascade" }),

    // Core listing info
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: text("status", {
      enum: ["draft", "published", "archived"],
    })
      .notNull()
      .default("published"),
    publishedAt: timestamp("published_at"),

    // Design data at listing level (shared designs)
    frontDesignR2Key: text("front_design_r2_key"),
    backDesignR2Key: text("back_design_r2_key"),

    // SEO
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    tags: json("tags").$type<string[]>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("creator_listings_creator_id_idx").on(table.creatorId),
    index("creator_listings_slug_idx").on(table.slug),
    index("creator_listings_status_idx").on(table.status),
    unique("creator_listings_creator_slug_unique").on(
      table.creatorId,
      table.slug,
    ),
  ],
);

// Creator products
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => creatorListings.id, { onDelete: "cascade" }),
    baseSkuId: uuid("base_sku_id")
      .notNull()
      .references(() => baseSkus.id, { onDelete: "restrict" }),

    // Pricing
    price: bigint("price", { mode: "bigint" }).notNull(),

    // Product-specific placement data
    frontPlacement: json("front_placement").$type<{
      left: number;
      top: number;
      width: number;
      height: number;
      rotation: number;
      relativeMidXOffset: number;
      relativeMidYOffset: number;
    }>(),

    backPlacement: json("back_placement").$type<{
      left: number;
      top: number;
      width: number;
      height: number;
      rotation: number;
      relativeMidXOffset: number;
      relativeMidYOffset: number;
    }>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_listing_id_idx").on(table.listingId),
    index("products_base_sku_id_idx").on(table.baseSkuId),
    unique("products_listing_base_unique").on(table.listingId, table.baseSkuId),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    comboHash: text("combo_hash").notNull(),
    price: bigint("price", { mode: "bigint" }),
    primaryMockupR2Key: text("primary_mockup_r2_key"),
    secondaryMockupR2Key: text("secondary_mockup_r2_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_variants_product_id_idx").on(table.productId),
    index("product_variants_sku_idx").on(table.sku),
    unique("product_variants_product_combo_unique").on(
      table.productId,
      table.comboHash,
    ),
  ],
);

export const variantAttributeValues = pgTable(
  "variant_attribute_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    attributeValueId: uuid("attribute_value_id")
      .notNull()
      .references(() => attributeValues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("variant_attribute_values_variant_id_idx").on(table.variantId),
    index("variant_attribute_values_attribute_id_idx").on(table.attributeId),
    index("variant_attribute_values_attribute_value_id_idx").on(
      table.attributeValueId,
    ),
    unique("variant_attribute_values_unique").on(
      table.variantId,
      table.attributeId,
    ),
  ],
);

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  listing: one(creatorListings, {
    fields: [products.listingId],
    references: [creatorListings.id],
  }),
  baseSku: one(baseSkus, {
    fields: [products.baseSkuId],
    references: [baseSkus.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    attributeValues: many(variantAttributeValues),
  }),
);

export const variantAttributeValuesRelations = relations(
  variantAttributeValues,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [variantAttributeValues.variantId],
      references: [productVariants.id],
    }),
    attribute: one(attributes, {
      fields: [variantAttributeValues.attributeId],
      references: [attributes.id],
    }),
    attributeValue: one(attributeValues, {
      fields: [variantAttributeValues.attributeValueId],
      references: [attributeValues.id],
    }),
  }),
);

export const creatorListingsRelations = relations(
  creatorListings,
  ({ one, many }) => ({
    creator: one(creators, {
      fields: [creatorListings.creatorId],
      references: [creators.id],
    }),
    products: many(products),
  }),
);
