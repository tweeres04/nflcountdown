import { ActionFunctionArgs, redirect } from '@remix-run/node'
import { trackFromServer } from '~/lib/analytics.server'
import { getUserId, logout } from '~/lib/session.server'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await getUserId(request)
	if (userId) {
		trackFromServer(request, userId, 'log out')
	}
	return logout(request)
}

// Direct GETs (e.g. a typed URL) just go home
export function loader() {
	return redirect('/')
}
