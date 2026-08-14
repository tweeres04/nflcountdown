import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import {
	findOrCreateGoogleUser,
	getGoogleEmail,
	oauthStateCookie,
} from '~/lib/googleAuth.server'
import { setProfileEmail, trackFromServer } from '~/lib/analytics.server'
import { parseSavablePath, savePage } from '~/lib/savedPages.server'
import { createUserSession } from '~/lib/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const code = url.searchParams.get('code')
	const state = url.searchParams.get('state')
	const stored = await oauthStateCookie.parse(request.headers.get('Cookie'))

	const email =
		code && state && stored?.state === state
			? await getGoogleEmail(request, code)
			: null
	if (!email) {
		return redirect('/login?error=google')
	}

	const user = await findOrCreateGoogleUser(email)

	if (typeof stored.save === 'string') {
		const path = stored.save.toLowerCase()
		if (parseSavablePath(path)) {
			await savePage(user.id, path)
		}
	}

	trackFromServer(request, user.id, user.created ? 'sign up' : 'log in', {
		method: 'google',
	})
	setProfileEmail(request, user.id, email)

	return createUserSession(user.id, '/')
}
