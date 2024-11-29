import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useContext } from 'react'
import countdown from '../external/countdown'

import { LeagueContext } from '~/lib/league-context'
import { addHours, isWithinInterval } from 'date-fns'
import { getGameSlug } from '~/lib/getGameSlug'
import Countdown from '~/components/countdown'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { generateMeta } from '~/lib/generateMeta'

export { generateMeta as meta }

export async function loader({
	params: { teamAbbrev, gameSlug },
}: LoaderFunctionArgs) {
	const { LEAGUE, teams, team, games } = getTeamAndGames(teamAbbrev)

	const currentGame = games.find((g) => {
		if (!g.time) return false
		const expectedSlug = getGameSlug(g, team.abbreviation)
		return expectedSlug === gameSlug
	})

	if (!currentGame) {
		throw new Response(null, { status: 404 })
	}

	return json({ LEAGUE, teams, team, game: currentGame, games })
}

export default function GameCountdown() {
	const { teams, team, game, games } = useLoaderData<typeof loader>()

	return (
		<Countdown
			team={team}
			teams={teams}
			games={games}
			game={game}
			pageTitle={
				<>
					{team.fullName} vs{' '}
					{game.homeTeam.abbreviation !== team.abbreviation
						? game.homeTeam.fullName
						: game.awayTeam.fullName}
				</>
			}
		/>
	)
}
