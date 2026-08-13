import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { eq } from 'drizzle-orm'
import { db } from './db.server'
import { users } from './schema.server'

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
	throw new Error('SESSION_SECRET not found')
}

const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'session',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 30 * 24 * 60 * 60, // 30 days
		secrets: [process.env.SESSION_SECRET ?? 'dev-secret'],
	},
})

export async function createUserSession(userId: number, redirectTo: string) {
	const session = await sessionStorage.getSession()
	session.set('userId', userId)
	return redirect(redirectTo, {
		headers: { 'Set-Cookie': await sessionStorage.commitSession(session) },
	})
}

export async function getUserId(request: Request) {
	const session = await sessionStorage.getSession(
		request.headers.get('Cookie')
	)
	const userId = session.get('userId')
	return typeof userId === 'number' ? userId : null
}

export async function getUser(request: Request) {
	const userId = await getUserId(request)
	if (!userId) return null
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { id: true, email: true },
	})
	return user ?? null
}

export async function logout(request: Request) {
	const session = await sessionStorage.getSession(
		request.headers.get('Cookie')
	)
	return redirect('/', {
		headers: { 'Set-Cookie': await sessionStorage.destroySession(session) },
	})
}
