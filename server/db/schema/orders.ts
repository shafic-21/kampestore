
import { pgTable, uuid, text, bigint, timestamp, integer, json, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { carts } from './cart';
import { products, productVariants } from './products';
import { creators } from './creators';
import { addresses } from './address';

export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'paid',
  'processing',
  'printing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'partial_refund'
]);

export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'unfulfilled',
  'partially_fulfilled',
  'fulfilled'
]);

export const itemFulfillmentStatusEnum = pgEnum('item_fulfillment_status', [
  'pending',
  'printing',
  'printed',
  'shipped'
]);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: text('user_id').notNull().references(() => user.id),
  cartId: uuid('cart_id').references(() => carts.id),

  // Shipping address reference
  shippingAddressId: uuid('shipping_address_id').references(() => addresses.id),

  // Billing address (if different from shipping)
  billingAddressId: uuid('billing_address_id').references(() => addresses.id),

  // Status tracking (same as before)
  status: orderStatusEnum('status').notNull().default('pending_payment'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status').notNull().default('unfulfilled'),

  // Pricing snapshot (same as before)
  subtotal: bigint('subtotal', { mode: 'bigint' }).notNull(),
  discount: bigint('discount', { mode: 'bigint' }).notNull(),
  tax: bigint('tax', { mode: 'bigint' }).notNull(),
  shipping: bigint('shipping', { mode: 'bigint' }).notNull(),
  total: bigint('total', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull().default('UGX'),

  // Customer info snapshot (kept for historical record)
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerName: text('customer_name').notNull(),

  // Address snapshot (for historical accuracy if address is edited/deleted)
  shippingAddressSnapshot: json('shipping_address_snapshot').$type<{
    recipientName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    postalCode?: string;
    country: string;
    deliveryInstructions?: string;
  }>().notNull(),

  // Additional data (same as before)
  metadata: json('metadata').$type<{
    source?: string;
    campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    payment_method?: string;
    device?: string;
    ip?: string;
  }>(),
  notes: text('notes'),

  // Timestamps (same as before)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  paidAt: timestamp('paid_at'),
  fulfilledAt: timestamp('fulfilled_at'),
  cancelledAt: timestamp('cancelled_at'),
}, (table) => [
  index('order_user_idx').on(table.userId),
  index('order_number_idx').on(table.orderNumber),
  index('order_status_idx').on(table.status),
  index('order_payment_status_idx').on(table.paymentStatus),
  index('order_fulfillment_status_idx').on(table.fulfillmentStatus),
  index('order_created_idx').on(table.createdAt),
  index('order_shipping_address_idx').on(table.shippingAddressId),
]);


export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),

  // Product snapshot (preserve at order time)
  productTitle: text('product_title').notNull(),
  variantTitle: text('variant_title').notNull(),
  sku: text('sku').notNull(),

  // Pricing and quantity
  quantity: integer('quantity').notNull(),
  unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
  unitCost: bigint('unit_cost', { mode: 'bigint' }).notNull(),
  subtotal: bigint('subtotal', { mode: 'bigint' }).notNull(),
  creatorEarnings: bigint('creator_earnings', { mode: 'bigint' }).notNull(),

  // POD specific files
  printFileR2Key: text('print_file_r2_key'),
  designR2Key: text('design_r2_key').notNull(),
  mockupR2Key: text('mockup_r2_key'),
  printSpec: json('print_spec').$type<{
    dpi: number;
    width: number;
    height: number;
    placement: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    colorMode: string;
  }>(),

  // Fulfillment tracking
  fulfillmentStatus: itemFulfillmentStatusEnum('fulfillment_status').notNull().default('pending'),
  printedAt: timestamp('printed_at'),
  shippedAt: timestamp('shipped_at'),
}, (table) => [
  index('order_item_order_idx').on(table.orderId),
  index('order_item_product_idx').on(table.productId),
  index('order_item_variant_idx').on(table.variantId),
  index('order_item_creator_idx').on(table.creatorId),
  index('order_item_fulfillment_idx').on(table.fulfillmentStatus),
]);

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  reason: text('reason'),
  metadata: json('metadata'),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('order_history_order_idx').on(table.orderId),
  index('order_history_created_idx').on(table.createdAt),
]);

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  cart: one(carts, {
    fields: [orders.cartId],
    references: [carts.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  creator: one(creators, {
    fields: [orderItems.creatorId],
    references: [creators.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  createdByUser: one(user, {
    fields: [orderStatusHistory.createdBy],
    references: [user.id],
  }),
}));
