import { pgTable, uuid, text, bigint, timestamp, integer, json, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user} from './auth';
import { products, productVariants } from './products';

export const cartStatusEnum = pgEnum('cart_status', [
  'active',
  'abandoned',
  'converted',
  'merged'
]);

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  status: cartStatusEnum('status').notNull().default('active'),
  expiresAt: timestamp('expires_at'),

  // Pricing in UGX (stored as bigint for precision)
  currency: text('currency').notNull().default('UGX'),
  subtotal: bigint('subtotal', { mode: 'bigint' }).notNull(),
  discount: bigint('discount', { mode: 'bigint' }).notNull(),
  tax: bigint('tax', { mode: 'bigint' }).notNull(),
  shipping: bigint('shipping', { mode: 'bigint' }).notNull(),
  total: bigint('total', { mode: 'bigint' }).notNull(),

  // Metadata for analytics and tracking
  metadata: json('metadata').$type<{
    source?: string;
    campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    device?: string;
    ip?: string;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  abandonedAt: timestamp('abandoned_at'),
  convertedAt: timestamp('converted_at'),
}, (table) => [
  index('cart_user_status_idx').on(table.userId, table.status),
  index('cart_session_idx').on(table.sessionId, table.status),
  index('cart_expires_idx').on(table.expiresAt),
  index('cart_status_idx').on(table.status),
  // Partial unique index - only one active cart per user
  uniqueIndex('unique_active_cart_per_user')
    .on(table.userId, table.status)
    .where(sql`status = 'active' AND user_id IS NOT NULL`),
]);

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),

  // Quantity and pricing
  quantity: integer('quantity').notNull().default(1),
  unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
  subtotal: bigint('subtotal', { mode: 'bigint' }).notNull(),

  // POD specific customization
  customization: json('customization').$type<{
    designR2Key?: string;
    placement?: {
      front?: { x: number; y: number; width: number; height: number; };
      back?: { x: number; y: number; width: number; height: number; };
    };
    mockupR2Key?: string;
    printFileR2Key?: string;
  }>(),

  // Timestamps
  addedAt: timestamp('added_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('cart_item_cart_idx').on(table.cartId),
  index('cart_item_product_idx').on(table.productId),
  index('cart_item_variant_idx').on(table.variantId),
  // Prevent duplicate variants in same cart
  uniqueIndex('unique_variant_per_cart').on(table.cartId, table.variantId),
]);

// Relations
export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(user, {
    fields: [carts.userId],
    references: [user.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));
