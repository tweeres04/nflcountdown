import { ActionFunctionArgs, redirect } from '@remix-run/node'
import { logout } from '~/lib/session.server'

export async function action({ request }: ActionFunctionArgs) {
	return logout(request)
}

// Direct GETs (e.g. a typed URL) just go home
export function loader() {
	return redirect('/')
}
