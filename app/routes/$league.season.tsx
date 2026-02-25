import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'

/**
 * 301 redirect: /{league}/season → /{league}
 * The season countdown is now part of the league index page.
 */
export async function loader({ params }: LoaderFunctionArgs) {
	const league = params.league?.toLowerCase() ?? 'nfl'
	return redirect(`/${league}`, { status: 301 })
}
