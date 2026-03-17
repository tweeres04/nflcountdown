import { json, LoaderFunctionArgs } from '@remix-run/node'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { getCachedGamePreview } from '~/lib/gemini-service'

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const league = url.searchParams.get('league')
	const gameId = url.searchParams.get('gameId')
	const teamAbbrev = url.searchParams.get('teamAbbrev')

	if (!league || !gameId || !teamAbbrev) {
		return json({ preview: null }, { status: 400 })
	}

	if (!process.env.GOOGLE_AI_API_KEY) {
		return json({ preview: null })
	}

	try {
		const { LEAGUE, team, games } = await getTeamAndGames(league, teamAbbrev)
		const game = games.find((g) => g.id === gameId)

		if (!game || !game.homeTeam || !game.awayTeam) {
			return json({ preview: null })
		}

		const preview = await getCachedGamePreview(LEAGUE, game, team)
		return json({ preview })
	} catch (e) {
		console.error('[api.game-preview] Error generating preview:', e)
		return json({ preview: null }, { status: 500 })
	}
}
