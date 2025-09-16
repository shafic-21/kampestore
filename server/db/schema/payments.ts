import { pgTable, uuid, text, bigint, timestamp, json, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';

export const paymentProviderEnum = pgEnum('payment_provider', [
  'mtn_momo',
  'airtel_money',
  'card',
  'cash_on_delivery',
  'bank_transfer'
]);

export const paymentTransactionStatusEnum = pgEnum('payment_transaction_status', [
  'pending',
  'processing',
  'success',
  'failed',
  'reversed',
  'expired'
]);

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),

  // Transaction details
  provider: paymentProviderEnum('provider').notNull(),
  transactionId: text('transaction_id').notNull(), // Provider's reference
  externalReference: text('external_reference'), // Our reference sent to provider

  // Amount in UGX
  amount: bigint('amount', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull().default('UGX'),

  // Status
  status: paymentTransactionStatusEnum('status').notNull().default('pending'),

  // Provider response data
  metadata: json('metadata').$type<{
    providerResponse?: any;
    phoneNumber?: string;
    accountNumber?: string;
    failureReason?: string;
    reversalReason?: string;
    ipAddress?: string;
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  completedAt: timestamp('completed_at'),
  failedAt: timestamp('failed_at'),
  reversedAt: timestamp('reversed_at'),
}, (table) => [
  index('payment_order_idx').on(table.orderId),
  index('payment_transaction_idx').on(table.transactionId),
  index('payment_external_ref_idx').on(table.externalReference),
  index('payment_status_idx').on(table.status),
  index('payment_provider_idx').on(table.provider),
  index('payment_created_idx').on(table.createdAt),
]);

// Relations
export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  order: one(orders, {
    fields: [paymentTransactions.orderId],
    references: [orders.id],
  }),
}));
