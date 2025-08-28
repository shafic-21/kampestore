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
  check,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  categories,
  attributes,
  attributeValueSets,
  attributeValues,
} from "./catalog";
import { sql } from "drizzle-orm";

// Base product templates
export const baseSkus = pgTable(
  "base_skus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    cost: bigint("cost", { mode: "bigint" }).notNull(),
    printSpec: json("print_spec"),
    status: text("status", {
      enum: ["active", "deprecated"],
    })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("base_skus_code_idx").on(table.code),
    index("base_skus_category_id_idx").on(table.categoryId),
    index("base_skus_status_idx").on(table.status),
  ],
);

// Which attributes apply to a base
export const baseSkuAttributeRules = pgTable(
  "base_sku_attribute_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseSkuId: uuid("base_sku_id")
      .notNull()
      .references(() => baseSkus.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    valueSetId: uuid("value_set_id").references(() => attributeValueSets.id, {
      onDelete: "cascade",
    }),
    valueId: uuid("value_id").references(() => attributeValues.id, {
      onDelete: "cascade",
    }),
    isVariantDefining: boolean("is_variant_defining").notNull().default(false),
    isRequired: boolean("is_required").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("base_sku_attribute_rules_base_sku_id_idx").on(table.baseSkuId),
    index("base_sku_attribute_rules_attribute_id_idx").on(table.attributeId),
    index("base_sku_attribute_rules_value_set_id_idx").on(table.valueSetId),
    index("base_sku_attribute_rules_position_idx").on(table.position),
    unique("base_sku_attribute_rules_unique").on(
      table.baseSkuId,
      table.attributeId,
    ),
    check(
      "rule_type_chk",
      sql`
          (value_set_id IS NOT NULL AND value_id IS NULL) OR
          (value_set_id IS NULL AND value_id IS NOT NULL)
        `,
    ),
  ],
);

// Product views (front, back, etc.)
export const baseSkuViews = pgTable(
  "base_sku_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseSkuId: uuid("base_sku_id")
      .notNull()
      .references(() => baseSkus.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    displayName: text("display_name").notNull(),
    order: integer("order").notNull().default(0),
    sourceWidthPx: integer("source_width_px").notNull(),
    sourceHeightPx: integer("source_height_px").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("base_sku_views_base_sku_id_idx").on(table.baseSkuId),
    index("base_sku_views_code_idx").on(table.code),
    index("base_sku_views_order_idx").on(table.order),
    unique("base_sku_views_base_sku_code_unique").on(
      table.baseSkuId,
      table.code,
    ),
  ],
);

// Print areas per view
export const baseSkuPrintAreas = pgTable(
  "base_sku_print_areas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseSkuId: uuid("base_sku_id")
      .notNull()
      .references(() => baseSkus.id, { onDelete: "cascade" }),
    viewId: uuid("view_id")
      .notNull()
      .references(() => baseSkuViews.id, { onDelete: "cascade" }),
    xPx: integer("x_px").notNull().default(1000),
    yPx: integer("y_px").notNull().default(1000),
    widthPx: integer("width_px").notNull(),
    heightPx: integer("height_px").notNull(),
    sourceWidthPx: integer("source_width_px").notNull(),
    sourceHeightPx: integer("source_height_px").notNull(),
    dpi: integer("dpi").notNull().default(300),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("base_sku_print_areas_base_sku_id_idx").on(table.baseSkuId),
    index("base_sku_print_areas_view_id_idx").on(table.viewId),
    unique("base_sku_print_areas_view_unique").on(table.viewId),
    check("positive_dimensions", sql`width_px > 0 AND height_px > 0`),
    check("positive_coordinates", sql`x_px >= 0 AND y_px >= 0`),
  ],
);

export const baseSkuMockups = pgTable(
  "base_sku_mockups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseSkuId: uuid("base_sku_id")
      .notNull()
      .references(() => baseSkus.id, { onDelete: "cascade" }),
    viewId: uuid("view_id")
      .notNull()
      .references(() => baseSkuViews.id, { onDelete: "cascade" }),
    purpose: text("purpose", {
      enum: ["editor_background", "display_card", "lifestyle"],
    }).notNull(),
    r2Key: text("r2_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // General indexes for performance
    index("base_sku_mockups_base_sku_id_idx").on(table.baseSkuId),
    index("base_sku_mockups_view_id_idx").on(table.viewId),
    index("base_sku_mockups_purpose_idx").on(table.purpose),
  ],
);

// export const baseSkuMockups = pgTable(
//   "base_sku_mockups",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),
//     baseSkuId: uuid("base_sku_id")
//       .notNull()
//       .references(() => baseSkus.id, { onDelete: "cascade" }),
//     viewId: uuid("view_id")
//       .notNull()
//       .references(() => baseSkuViews.id, { onDelete: "cascade" }),
//     r2Key: text("r2_key").notNull(),
//     isHero: boolean("is_hero").notNull().default(false),
//     sourceWidthPx: integer("source_width_px").notNull(),
//     sourceHeightPx: integer("source_height_px").notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => [
//     index("base_sku_mockups_base_sku_id_idx").on(table.baseSkuId),
//     index("base_sku_mockups_view_id_idx").on(table.viewId),
//     index("base_sku_mockups_is_hero_idx").on(table.isHero),
//     unique("base_sku_mockups_base_view_unique").on(
//       table.baseSkuId,
//       table.viewId,
//     ),
//   ],
// );

// Relations
export const baseSkusRelations = relations(baseSkus, ({ one, many }) => ({
  category: one(categories, {
    fields: [baseSkus.categoryId],
    references: [categories.id],
  }),
  attributeRules: many(baseSkuAttributeRules),
  views: many(baseSkuViews),
  printAreas: many(baseSkuPrintAreas),
}));

export const baseSkuAttributeRulesRelations = relations(
  baseSkuAttributeRules,
  ({ one }) => ({
    baseSku: one(baseSkus, {
      fields: [baseSkuAttributeRules.baseSkuId],
      references: [baseSkus.id],
    }),
    attribute: one(attributes, {
      fields: [baseSkuAttributeRules.attributeId],
      references: [attributes.id],
    }),
    valueSet: one(attributeValueSets, {
      fields: [baseSkuAttributeRules.valueSetId],
      references: [attributeValueSets.id],
    }),
    value: one(attributeValues, {
      fields: [baseSkuAttributeRules.valueId],
      references: [attributeValues.id],
    }),
  }),
);

export const baseSkuViewsRelations = relations(
  baseSkuViews,
  ({ one, many }) => ({
    baseSku: one(baseSkus, {
      fields: [baseSkuViews.baseSkuId],
      references: [baseSkus.id],
    }),
    printAreas: many(baseSkuPrintAreas),
    mockups: many(baseSkuMockups),
  }),
);

export const baseSkuPrintAreasRelations = relations(
  baseSkuPrintAreas,
  ({ one }) => ({
    baseSku: one(baseSkus, {
      fields: [baseSkuPrintAreas.baseSkuId],
      references: [baseSkus.id],
    }),
    view: one(baseSkuViews, {
      fields: [baseSkuPrintAreas.viewId],
      references: [baseSkuViews.id],
    }),
  }),
);

export const baseSkuMockupsRelations = relations(baseSkuMockups, ({ one }) => ({
  baseSku: one(baseSkus, {
    fields: [baseSkuMockups.baseSkuId],
    references: [baseSkus.id],
  }),
  view: one(baseSkuViews, {
    fields: [baseSkuMockups.viewId],
    references: [baseSkuViews.id],
  }),
}));
