import { clientIp } from './rateLimit.server'

/**
 * Server-side Mixpanel tracking for auth outcomes — fired from actions so
 * ad-blockers can't eat them, and only on real success. Mirrors to the
 * legacy project like the client wrapper in analytics.ts. Fire-and-forget:
 * analytics must never block or fail a user's request.
 */

function tokens() {
	return [process.env.MIXPANEL_TOKEN, process.env.MIXPANEL_TOKEN_LEGACY].filter(
		(t): t is string => Boolean(t)
	)
}

function post(url: string, data: unknown) {
	fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ data: JSON.stringify(data) }),
	}).catch((error) => console.error('Mixpanel request failed', error))
}

export function trackFromServer(
	request: Request,
	userId: number,
	event: string,
	properties: Record<string, unknown> = {}
) {
	for (const token of tokens()) {
		post('https://api.mixpanel.com/track', {
			event,
			properties: {
				token,
				distinct_id: String(userId),
				$user_id: String(userId),
				// Client IP so Mixpanel geolocates the user, not the server
				ip: clientIp(request),
				...properties,
			},
		})
	}
}

export function setProfileEmail(
	request: Request,
	userId: number,
	email: string
) {
	for (const token of tokens()) {
		post('https://api.mixpanel.com/engage', {
			$token: token,
			$distinct_id: String(userId),
			$ip: clientIp(request),
			$set: { $email: email },
		})
	}
}
