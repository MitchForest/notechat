import { pgTable, text, timestamp, uuid, pgEnum, boolean, jsonb, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// --- Enums ---

export const collectionTypeEnum = pgEnum('collection_type', ['manual', 'smart', 'default'])

// --- Tables ---

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
    spaces: many(spaces),
    notes: many(notes),
    collections: many(collections),
}))

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // 'github' or 'google'
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}))

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}))

export const spaces = pgTable('spaces', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    emoji: text('emoji'),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const spacesRelations = relations(spaces, ({ one, many }) => ({
    user: one(users, {
        fields: [spaces.userId],
        references: [users.id],
    }),
    collections: many(collections),
    notes: many(notes)
}))

export const collections = pgTable('collections', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    spaceId: uuid('space_id').references(() => spaces.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    type: collectionTypeEnum('type').notNull(),
    smartRules: jsonb('smart_rules'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const collectionsRelations = relations(collections, ({ one, many }) => ({
    user: one(users, {
        fields: [collections.userId],
        references: [users.id],
    }),
    space: one(spaces, {
        fields: [collections.spaceId],
        references: [spaces.id],
    }),
    notesToCollections: many(notesToCollections),
}))

export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    spaceId: uuid('space_id').references(() => spaces.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').default('Untitled Note').notNull(),
    content: jsonb('content'),
    isStarred: boolean('is_starred').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const notesRelations = relations(notes, ({ one, many }) => ({
    user: one(users, {
        fields: [notes.userId],
        references: [users.id],
    }),
    space: one(spaces, {
        fields: [notes.spaceId],
        references: [spaces.id],
    }),
    notesToCollections: many(notesToCollections),
}))

export const notesToCollections = pgTable('notes_to_collections', {
    noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.noteId, t.collectionId] }),
}))

export const notesToCollectionsRelations = relations(notesToCollections, ({ one }) => ({
    note: one(notes, {
        fields: [notesToCollections.noteId],
        references: [notes.id],
    }),
    collection: one(collections, {
        fields: [notesToCollections.collectionId],
        references: [collections.id],
    }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type Space = typeof spaces.$inferSelect
export type NewSpace = typeof spaces.$inferInsert
export type Collection = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type NoteToCollection = typeof notesToCollections.$inferSelect
export type NewNoteToCollection = typeof notesToCollections.$inferInsert 