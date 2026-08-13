import argon2 from 'argon2'
import { eq } from 'drizzle-orm'
import { db } from './db.server'
import { users } from './schema.server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX = 254
const PASSWORD_MIN = 8
// Cap length before hashing so huge payloads can't tie up argon2
const PASSWORD_MAX = 256

// Emails are compared lowercased so the same address can't sign up twice
export function normalizeEmail(email: string) {
	return email.trim().toLowerCase()
}

export function validateEmail(email: string) {
	if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
		return "That email doesn't look right. Check it and try again?"
	}
	return null
}

export function validatePassword(password: string) {
	if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
		return 'Passwords need at least 8 characters.'
	}
	return null
}

export function validateCredentials(email: string, password: string) {
	return validateEmail(email) ?? validatePassword(password)
}

export async function updatePassword(userId: number, password: string) {
	const hashedPassword = await argon2.hash(password)
	await db
		.update(users)
		.set({ password: hashedPassword })
		.where(eq(users.id, userId))
}

export async function createUser(email: string, password: string) {
	const hashedPassword = await argon2.hash(password)
	const [user] = await db
		.insert(users)
		.values({ email, password: hashedPassword })
		.returning({ id: users.id })
	return user
}

export function isEmailTakenError(error: unknown) {
	// Drizzle wraps the libsql error, and the code differs by wrapper level
	// (SQLITE_CONSTRAINT vs SQLITE_CONSTRAINT_UNIQUE) — sqlite's constraint
	// message is the reliable signal, wherever it sits in the cause chain
	let cause: unknown = error
	while (cause instanceof Error) {
		if (cause.message.includes('UNIQUE constraint failed: users.email')) {
			return true
		}
		cause = cause.cause
	}
	return false
}

export async function verifyLogin(email: string, password: string) {
	if (password.length > PASSWORD_MAX) return null
	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
	})
	const validPassword = user
		? await argon2.verify(user.password, password)
		: false
	return validPassword && user ? { id: user.id, email: user.email } : null
}
