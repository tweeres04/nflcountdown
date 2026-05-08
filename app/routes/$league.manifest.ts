import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { buildLeagueManifest } from '~/lib/leagueManifest'

export async function loader({ params: { league } }: LoaderFunctionArgs) {
	return json(buildLeagueManifest(league, `/${league?.toLowerCase()}`))
}
