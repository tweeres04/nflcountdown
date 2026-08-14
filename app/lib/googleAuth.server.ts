import { createCookie } from '@remix-run/node'
import { eq } from 'drizzle-orm'
import { db } from './db.server'
import { users } from './schema.server'
import { normalizeEmail } from './auth.server'

// Short-lived CSRF state for the OAuth round trip; also carries a pending
// save path through the redirect dance
export const oauthStateCookie = createCookie('oauth_state', {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax',
	path: '/',
	maxAge: 10 * 60,
	secrets: [process.env.SESSION_SECRET ?? 'dev-secret'],
})

function clientId() {
	const id = process.env.GOOGLE_OAUTH_CLIENT_ID
	if (!id) throw new Error('GOOGLE_OAUTH_CLIENT_ID not found')
	return id
}

function clientSecret() {
	const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
	if (!secret) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET not found')
	return secret
}

// Must exactly match an authorized redirect URI on the OAuth client
export function redirectUri(request: Request) {
	return process.env.NODE_ENV === 'production'
		? 'https://teamcountdown.com/auth/google/callback'
		: `${new URL(request.url).origin}/auth/google/callback`
}

export function buildGoogleAuthUrl(request: Request, state: string) {
	const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
	url.searchParams.set('client_id', clientId())
	url.searchParams.set('redirect_uri', redirectUri(request))
	url.searchParams.set('response_type', 'code')
	url.searchParams.set('scope', 'openid email')
	url.searchParams.set('state', state)
	return url.toString()
}

// Exchanges the callback code for Google's id_token and returns the verified
// email. The token comes straight from Google over TLS, so decoding the
// payload without checking the signature is safe; aud and email_verified
// still get checked.
export async function getGoogleEmail(request: Request, code: string) {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		body: new URLSearchParams({
			code,
			client_id: clientId(),
			client_secret: clientSecret(),
			redirect_uri: redirectUri(request),
			grant_type: 'authorization_code',
		}),
	})
	if (!response.ok) {
		console.error('Google token exchange failed', await response.text())
		return null
	}
	const { id_token: idToken } = (await response.json()) as {
		id_token?: string
	}
	if (!idToken) return null

	const payload = JSON.parse(
		Buffer.from(idToken.split('.')[1], 'base64url').toString()
	) as { aud?: string; email?: string; email_verified?: boolean }

	if (payload.aud !== clientId() || !payload.email_verified || !payload.email) {
		return null
	}
	return normalizeEmail(payload.email)
}

// Google-verified emails link to an existing account or create a
// passwordless one
export async function findOrCreateGoogleUser(email: string) {
	const existing = await db.query.users.findFirst({
		where: eq(users.email, email),
		columns: { id: true },
	})
	if (existing) return { id: existing.id, created: false }
	const [user] = await db
		.insert(users)
		.values({ email })
		.returning({ id: users.id })
	return { id: user.id, created: true }
}
