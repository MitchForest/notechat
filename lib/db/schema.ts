import { pgTable, text, timestamp, pgEnum, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// --- Enums ---

export const entityTypeEnum = pgEnum('entity_type', ['static', 'seeded', 'user', 'system'])

// --- Tables ---

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many, one }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
    spaces: many(spaces),
    notes: many(notes),
    collections: many(collections),
    chats: many(chats),
    preferences: one(userPreferences),
}))

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
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
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
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
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    emoji: text('emoji'),
    type: entityTypeEnum('type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const spacesRelations = relations(spaces, ({ one, many }) => ({
    user: one(users, {
        fields: [spaces.userId],
        references: [users.id],
    }),
    collections: many(collections),
    notes: many(notes),
    chats: many(chats),
}))

export const collections = pgTable('collections', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    spaceId: text('space_id').references(() => spaces.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    icon: text('icon').default('folder'),
    type: entityTypeEnum('type').notNull(),
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
    notes: many(notes),
    chats: many(chats),
}))

export const notes = pgTable('notes', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    spaceId: text('space_id').references(() => spaces.id, { onDelete: 'set null' }),
    collectionId: text('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    title: text('title').default('Untitled Note').notNull(),
    content: jsonb('content'),
    isStarred: boolean('is_starred').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const notesRelations = relations(notes, ({ one }) => ({
    user: one(users, {
        fields: [notes.userId],
        references: [users.id],
    }),
    space: one(spaces, {
        fields: [notes.spaceId],
        references: [spaces.id],
    }),
    collection: one(collections, {
        fields: [notes.collectionId],
        references: [collections.id],
    }),
}))

export const chats = pgTable('chats', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    spaceId: text('space_id').references(() => spaces.id, { onDelete: 'set null' }),
    collectionId: text('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    title: text('title').default('Untitled Chat').notNull(),
    content: jsonb('content'),
    isStarred: boolean('is_starred').default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const chatsRelations = relations(chats, ({ one, many }) => ({
    user: one(users, {
        fields: [chats.userId],
        references: [users.id],
    }),
    space: one(spaces, {
        fields: [chats.spaceId],
        references: [spaces.id],
    }),
    collection: one(collections, {
        fields: [chats.collectionId],
        references: [collections.id],
    }),
    messages: many(messages),
}))

// --- Messages Table ---

export const messages = pgTable('messages', {
    id: text('id').primaryKey(),
    chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const messagesRelations = relations(messages, ({ one }) => ({
    chat: one(chats, {
        fields: [messages.chatId],
        references: [chats.id],
    }),
}))

// --- Smart Collections ---

export const smartCollections = pgTable('smart_collections', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    spaceId: text('space_id').references(() => spaces.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    filterConfig: jsonb('filter_config').notNull(),
    isProtected: boolean('is_protected').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const smartCollectionsRelations = relations(smartCollections, ({ one }) => ({
    user: one(users, {
        fields: [smartCollections.userId],
        references: [users.id],
    }),
    space: one(spaces, {
        fields: [smartCollections.spaceId],
        references: [spaces.id],
    }),
}))

// --- User Preferences ---

export const userPreferences = pgTable('user_preferences', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
    preferences: jsonb('preferences').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
    user: one(users, {
        fields: [userPreferences.userId],
        references: [users.id],
    }),
}))

// Type for AI preferences
export interface AIPreferences {
    customCommands?: {
        id: string
        label: string
        prompt: string
        icon?: string
        order?: number
    }[]
    hiddenDefaultCommands?: string[]
    commandOrder?: string[]
}

// --- AI Feedback ---

export const aiFeedback = pgTable('ai_feedback', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    operation: text('operation').notNull(), // 'transform', 'completion', 'ghost-text'
    action: text('action').notNull(), // 'accepted', 'ignored', 'edited'
    prompt: text('prompt'),
    input: text('input'),
    output: text('output'),
    finalText: text('final_text'), // What was actually inserted (if edited)
    metadata: jsonb('metadata'), // Additional context like duration, position, etc
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const aiFeedbackRelations = relations(aiFeedback, ({ one }) => ({
    user: one(users, {
        fields: [aiFeedback.userId],
        references: [users.id],
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
export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type SmartCollection = typeof smartCollections.$inferSelect
export type NewSmartCollection = typeof smartCollections.$inferInsert
export type UserPreferences = typeof userPreferences.$inferSelect
export type NewUserPreferences = typeof userPreferences.$inferInsert
export type AIFeedback = typeof aiFeedback.$inferSelect
export type NewAIFeedback = typeof aiFeedback.$inferInsert 