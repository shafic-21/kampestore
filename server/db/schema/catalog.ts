import { pgTable, text, uuid, timestamp, integer, boolean, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Hierarchical product categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  level: integer("level").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("categories_parent_id_idx").on(table.parentId),
  index("categories_slug_idx").on(table.slug),
  index("categories_level_idx").on(table.level),
]);

// Attribute definitions (color, size, material)
export const attributes = pgTable("attributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  dataType: text("data_type", { 
    enum: ["string", "number", "boolean", "color"] 
  }).notNull().default("string"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("attributes_code_idx").on(table.code),
  index("attributes_data_type_idx").on(table.dataType),
]);

// Value sets for attributes (e.g., "basic colors", "apparel sizes")
export const attributeValueSets = pgTable("attribute_value_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("attribute_value_sets_code_idx").on(table.code),
  index("attribute_value_sets_attribute_id_idx").on(table.attributeId),
]);

// Actual values (e.g., "red", "medium")
export const attributeValues = pgTable("attribute_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  valueSetId: uuid("value_set_id").notNull().references(() => attributeValueSets.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  displayName: text("display_name").notNull(),
  hexColor: text("hex_color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("attribute_values_value_set_id_idx").on(table.valueSetId),
  index("attribute_values_code_idx").on(table.code),
  index("attribute_values_sort_order_idx").on(table.sortOrder),
  unique("attribute_values_value_set_code_unique").on(table.valueSetId, table.code),
]);

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, {
    relationName: "categoryParent",
  }),
}));

export const attributesRelations = relations(attributes, ({ many }) => ({
  valueSets: many(attributeValueSets),
}));

export const attributeValueSetsRelations = relations(attributeValueSets, ({ one, many }) => ({
  attribute: one(attributes, {
    fields: [attributeValueSets.attributeId],
    references: [attributes.id],
  }),
  values: many(attributeValues),
}));

export const attributeValuesRelations = relations(attributeValues, ({ one }) => ({
  valueSet: one(attributeValueSets, {
    fields: [attributeValues.valueSetId],
    references: [attributeValueSets.id],
  }),
}));