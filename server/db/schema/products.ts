import { pgTable, text, uuid, timestamp, bigint, json, integer, boolean, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { creators } from "./creators";
import { baseSkus, baseSkuViews } from "./bases";
import { attributes, attributeValues } from "./catalog";

// Creator products
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  baseSkuId: uuid("base_sku_id").notNull().references(() => baseSkus.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  designR2Key: text("design_r2_key").notNull(),
  placementByView: json("placement_by_view").notNull(),
  price: bigint("price", { mode: "bigint" }).notNull(),
  status: text("status", {
    enum: ["draft", "active", "inactive", "archived"]
  }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("products_creator_id_idx").on(table.creatorId),
  index("products_base_sku_id_idx").on(table.baseSkuId),
  index("products_slug_idx").on(table.slug),
  index("products_status_idx").on(table.status),
  index("products_created_at_idx").on(table.createdAt),
  unique("products_creator_slug_unique").on(table.creatorId, table.slug),
]);

// Product variants (color × size combinations)
export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  comboHash: text("combo_hash").notNull(),
  price: bigint("price", { mode: "bigint" }),
  primaryMockupR2Key: text("primary_mockup_r2_key"),
  secondaryMockupR2Key: text("secondary_mockup_r2_key"),
  printFileR2Key: text("print_file_r2_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_variants_product_id_idx").on(table.productId),
  index("product_variants_sku_idx").on(table.sku),
  index("product_variants_combo_hash_idx").on(table.comboHash),
  unique("product_variants_product_combo_unique").on(table.productId, table.comboHash),
]);

// Variant attributes
export const variantAttributeValues = pgTable("variant_attribute_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  attributeValueId: uuid("attribute_value_id").notNull().references(() => attributeValues.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("variant_attribute_values_variant_id_idx").on(table.variantId),
  index("variant_attribute_values_attribute_id_idx").on(table.attributeId),
  index("variant_attribute_values_attribute_value_id_idx").on(table.attributeValueId),
  unique("variant_attribute_values_unique").on(table.variantId, table.attributeId),
]);


// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  creator: one(creators, {
    fields: [products.creatorId],
    references: [creators.id],
  }),
  baseSku: one(baseSkus, {
    fields: [products.baseSkuId],
    references: [baseSkus.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  attributeValues: many(variantAttributeValues),
}));

export const variantAttributeValuesRelations = relations(variantAttributeValues, ({ one }) => ({
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
}));

