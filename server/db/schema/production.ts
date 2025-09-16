import { pgTable, uuid, text, integer, timestamp, json, pgEnum, index, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderItems } from './orders';
import { baseSkus } from './bases';

export const batchStatusEnum = pgEnum('batch_status', [
  'queued',
  'printing',
  'completed',
  'cancelled'
]);

export const batchItemStatusEnum = pgEnum('batch_item_status', [
  'queued',
  'printing',
  'completed',
  'failed',
  'cancelled'
]);

export const productionBatches = pgTable('production_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchNumber: text('batch_number').notNull().unique(),
  status: batchStatusEnum('status').notNull().default('queued'),

  // Product being printed
  baseSkuId: uuid('base_sku_id').notNull().references(() => baseSkus.id),

  // Batch details
  itemCount: integer('item_count').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),

  // Metadata
  metadata: json('metadata').$type<{
    printer?: string;
    notes?: string;
    priority?: number;
    estimatedCompletionTime?: string;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
}, (table) => [
  index('batch_number_idx').on(table.batchNumber),
  index('batch_status_idx').on(table.status),
  index('batch_base_sku_idx').on(table.baseSkuId),
  index('batch_created_idx').on(table.createdAt),
]);

export const productionBatchItems = pgTable('production_batch_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id').notNull().references(() => productionBatches.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),

  // Status tracking
  status: batchItemStatusEnum('status').notNull().default('queued'),
  position: integer('position').notNull(), // Order in batch

  // Production details
  printedAt: timestamp('printed_at'),
  qualityCheckPassed: boolean('quality_check_passed'),
  notes: text('notes'),

  // Error tracking
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('batch_item_batch_idx').on(table.batchId),
  index('batch_item_order_item_idx').on(table.orderItemId),
  index('batch_item_status_idx').on(table.status),
  index('batch_item_position_idx').on(table.batchId, table.position),
]);

// Relations
export const productionBatchesRelations = relations(productionBatches, ({ one, many }) => ({
  baseSku: one(baseSkus, {
    fields: [productionBatches.baseSkuId],
    references: [baseSkus.id],
  }),
  items: many(productionBatchItems),
}));

export const productionBatchItemsRelations = relations(productionBatchItems, ({ one }) => ({
  batch: one(productionBatches, {
    fields: [productionBatchItems.batchId],
    references: [productionBatches.id],
  }),
  orderItem: one(orderItems, {
    fields: [productionBatchItems.orderItemId],
    references: [orderItems.id],
  }),
}));
