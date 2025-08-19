import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for crop categories
export const cropCategoryEnum = pgEnum('crop_category', ['Sayur', 'Buah', 'Palawija', 'Perkebunan', 'Rempah']);

// Enum for theme preferences
export const themeEnum = pgEnum('theme', ['light', 'dark']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  is_admin: boolean('is_admin').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Crops table
export const cropsTable = pgTable('crops', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: cropCategoryEnum('category').notNull(),
  icon: text('icon').notNull(),
  estimated_cost: numeric('estimated_cost', { precision: 10, scale: 2 }).notNull(),
  potential_profit: numeric('potential_profit', { precision: 10, scale: 2 }).notNull(),
  is_favorite: boolean('is_favorite').notNull().default(false),
  is_stable: boolean('is_stable').notNull().default(false),
  is_public: boolean('is_public').notNull().default(false),
  tooltip_info: text('tooltip_info'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// User preferences table
export const userPreferencesTable = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  theme: themeEnum('theme').notNull().default('light'),
  favorite_crops: text('favorite_crops').default('[]'), // JSON array as text
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table for authentication
export const sessionsTable = pgTable('sessions', {
  id: text('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  preferences: one(userPreferencesTable),
  sessions: many(sessionsTable),
}));

export const userPreferencesRelations = relations(userPreferencesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userPreferencesTable.user_id],
    references: [usersTable.id],
  }),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Crop = typeof cropsTable.$inferSelect;
export type NewCrop = typeof cropsTable.$inferInsert;

export type UserPreferences = typeof userPreferencesTable.$inferSelect;
export type NewUserPreferences = typeof userPreferencesTable.$inferInsert;

export type Session = typeof sessionsTable.$inferSelect;
export type NewSession = typeof sessionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable,
  crops: cropsTable,
  userPreferences: userPreferencesTable,
  sessions: sessionsTable
};