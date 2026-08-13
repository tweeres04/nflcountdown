import { sql } from 'drizzle-orm'
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core'

// Schema changes ship via `drizzle-kit push` at container start (no TTY).
// Adding a NOT NULL column to an existing table triggers push's data-loss
// prompt, which crashes on non-TTY boots — new columns on existing tables
// must be nullable with no default.

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	// Null for accounts created via Google sign-in (they can set one later
	// through the password reset flow)
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
})

export const savedPages = sqliteTable(
	'saved_pages',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		path: text('path').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => [
		uniqueIndex('saved_pages_user_path').on(table.userId, table.path),
	]
)

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	// sha256 of the token — the raw value only ever lives in the email link
	tokenHash: text('token_hash').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
})

export type User = typeof users.$inferSelect
export type SavedPage = typeof savedPages.$inferSelect
