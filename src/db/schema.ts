import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'exploitations' table
export const exploitations = pgTable('exploitationsCustom', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  payload: text('payload').notNull(), // JSON string representing the full array and active exploitation
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'historical_fiches' table
export const historicalFiches = pgTable('historical_fiches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  payload: text('payload').notNull(), // JSON string representing fiches_historique
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'user_settings' table
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  payload: text('payload').notNull(), // JSON string of all other inputs like agriInputs, jardinInputs, etc.
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  exploitations: many(exploitations),
  historicalFiches: many(historicalFiches),
  userSettings: many(userSettings),
}));

export const exploitationsRelations = relations(exploitations, ({ one }) => ({
  author: one(users, {
    fields: [exploitations.userId],
    references: [users.id],
  }),
}));

export const historicalFichesRelations = relations(historicalFiches, ({ one }) => ({
  author: one(users, {
    fields: [historicalFiches.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));
