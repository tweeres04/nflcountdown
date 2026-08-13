import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { db } from './db.server'
import { passwordResetTokens, users } from './schema.server'

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex')
}

// Returns the raw token for the email link, or null if no account has that
// email. Any previous tokens for the user are invalidated.
export async function createResetToken(email: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
		columns: { id: true },
	})
	if (!user) return null

	const token = randomBytes(32).toString('base64url')
	await db
		.delete(passwordResetTokens)
		.where(eq(passwordResetTokens.userId, user.id))
	await db.insert(passwordResetTokens).values({
		userId: user.id,
		tokenHash: hashToken(token),
		expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
	})
	return token
}

// Look up a live token without consuming it (for rendering the reset form)
export async function findResetToken(token: string) {
	const row = await db.query.passwordResetTokens.findFirst({
		where: and(
			eq(passwordResetTokens.tokenHash, hashToken(token)),
			gt(passwordResetTokens.expiresAt, new Date())
		),
		columns: { userId: true },
	})
	return row ?? null
}

// Single-use: deletes every token for the user once one is redeemed
export async function consumeResetToken(token: string) {
	const row = await findResetToken(token)
	if (!row) return null
	await db
		.delete(passwordResetTokens)
		.where(eq(passwordResetTokens.userId, row.userId))
	return row
}
