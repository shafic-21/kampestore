import { pgTable, uuid, text, boolean, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

export const addressTypeEnum = pgEnum('address_type', [
  'residential',
  'office',
  'pickup_point',
  'other'
]);

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Address identification
  label: text('label').notNull(), // "Home", "Office", "Parents' House", etc.
  type: addressTypeEnum('type').notNull().default('residential'),

  // Recipient information
  recipientName: text('recipient_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  alternatePhone: text('alternate_phone'), // Backup contact

  // Address details
  addressLine1: text('address_line_1').notNull(),
  addressLine2: text('address_line_2'),
  landmark: text('landmark'), // "Near Shell Petrol Station"
  city: text('city').notNull(),
  region: text('region').notNull(), // District for Uganda
  postalCode: text('postal_code'),
  country: text('country').notNull().default('UG'),

  // Location data (for delivery optimization)
  latitude: text('latitude'), // Store as text for precision
  longitude: text('longitude'),
  plusCode: text('plus_code'), // Google Plus Codes for areas without addresses

  // Delivery metadata
  deliveryInstructions: text('delivery_instructions'),
  bestDeliveryTime: text('best_delivery_time'), // "Weekdays 9am-5pm"

  // Flags
  isDefault: boolean('is_default').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(false), // Address verification status
  isActive: boolean('is_active').notNull().default(true), // Soft delete

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  verifiedAt: timestamp('verified_at'),
}, (table) => [
  index('address_user_idx').on(table.userId),
  index('address_user_active_idx').on(table.userId, table.isActive),
  index('address_user_default_idx').on(table.userId, table.isDefault),
  index('address_region_idx').on(table.region), // For delivery zone analysis
  index('address_city_idx').on(table.city),
]);

// Relations
export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, {
    fields: [addresses.userId],
    references: [user.id],
  }),
}));
