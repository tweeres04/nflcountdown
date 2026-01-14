import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

import { addHours, isFuture } from 'date-fns'
import Countdown from '~/components/countdown'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { generateMeta } from '~/lib/generateMeta'
import { getCachedGamePreview } from '~/lib/gemini-service'
import { Game } from '~/lib/types'

export { generateMeta as meta }

export async function loader({ params: { teamAbbrev } }: LoaderFunctionArgs) {
	const { LEAGUE, teams, team, games } = await getTeamAndGames(teamAbbrev)

	const nextGame = games.find(
		(g: Game) => g.time && isFuture(addHours(g.time, 3))
	)

	// Generate AI preview for the next game
	let gamePreview: string | null = null
	try {
		if (
			process.env.GOOGLE_AI_API_KEY &&
			nextGame &&
			nextGame.homeTeam &&
			nextGame.awayTeam
		) {
			gamePreview = await getCachedGamePreview(nextGame.id, nextGame, team)
		}
	} catch (error) {
		console.error('Failed to generate game preview:', error)
		// Continue without preview
	}

	return json({ LEAGUE, teams, team, games, gamePreview })
}

export default function TeamCountdown() {
	const { teams, team, games, gamePreview } = useLoaderData<typeof loader>()
	const nextGame = games.find(
		(g: Game) => g.time && isFuture(addHours(g.time, 3))
	)

	return (
		<Countdown
			pageTitle={`${team.fullName} Countdown`}
			team={team}
			teams={teams}
			games={games}
			game={nextGame}
			gamePreview={gamePreview}
			isTeamPage={true}
		/>
	)
}
