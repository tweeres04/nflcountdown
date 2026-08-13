import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { randomBytes } from 'node:crypto'
import {
	buildGoogleAuthUrl,
	oauthStateCookie,
} from '~/lib/googleAuth.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const save = new URL(request.url).searchParams.get('save')
	const state = randomBytes(16).toString('hex')
	return redirect(buildGoogleAuthUrl(request, state), {
		headers: {
			'Set-Cookie': await oauthStateCookie.serialize({ state, save }),
		},
	})
}
