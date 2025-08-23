import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (table) => ({
  // Index for faster email lookups (even though it's unique, explicit index helps)
  emailIdx: index("user_email_idx").on(table.email),
  // Index for phone lookups if we add phone-based auth later
  phoneIdx: index("user_phone_idx").on(table.phone),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
  // Critical: Index for user session lookups - most important for auth performance
  userIdIdx: index("session_user_id_idx").on(table.userId),
  // Index for token lookups (even though it's unique, explicit index helps)
  tokenIdx: index("session_token_idx").on(table.token),
  // Index for cleanup operations to find expired sessions
  expiresAtIdx: index("session_expires_at_idx").on(table.expiresAt),
  // Composite index for user sessions cleanup
  userExpiresIdx: index("session_user_expires_idx").on(table.userId, table.expiresAt),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (table) => ({
  // Critical: Index for user account lookups
  userIdIdx: index("account_user_id_idx").on(table.userId),
  // Composite index for provider account lookups (OAuth flows)
  providerAccountIdx: index("account_provider_account_idx").on(table.providerId, table.accountId),
  // Index for token cleanup operations
  accessTokenExpiresIdx: index("account_access_token_expires_idx").on(table.accessTokenExpiresAt),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => ({
  // Critical: Index for OTP verification lookups by email/phone
  identifierIdx: index("verification_identifier_idx").on(table.identifier),
  // Index for cleanup operations to find expired verifications
  expiresAtIdx: index("verification_expires_at_idx").on(table.expiresAt),
  // Composite index for active verification lookups
  identifierExpiresIdx: index("verification_identifier_expires_idx").on(table.identifier, table.expiresAt),
}));
