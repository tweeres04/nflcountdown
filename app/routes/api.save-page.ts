import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { getUser } from '~/lib/session.server'
import {
	parseSavablePath,
	savePage,
	unsavePage,
} from '~/lib/savedPages.server'

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const rawPath = formData.get('path')
	const intent = formData.get('intent')

	const path = typeof rawPath === 'string' ? rawPath.toLowerCase() : ''
	if (!parseSavablePath(path)) {
		throw new Response('Bad Request', { status: 400 })
	}

	// getUser (not getUserId) so a session cookie for a deleted user row
	// lands on signup instead of a foreign key error
	const user = await getUser(request)
	if (!user) {
		return redirect(`/signup?save=${encodeURIComponent(path)}`)
	}

	// A click before hydration submits as a document POST — send those back
	// to the page. Fetcher submissions get json and revalidate in place.
	const documentPost = request.headers.get('sec-fetch-mode') === 'navigate'

	if (intent === 'unsave') {
		await unsavePage(user.id, path)
		return documentPost ? redirect(path) : json({ saved: false })
	}

	await savePage(user.id, path)
	return documentPost ? redirect(path) : json({ saved: true })
}
