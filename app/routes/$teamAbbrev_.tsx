import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import countdown from '../external/countdown'

import { addHours, isWithinInterval } from 'date-fns'
import Countdown from '~/components/countdown'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { generateMeta } from '~/lib/generateMeta'

export { generateMeta as meta }

export async function loader({ params: { teamAbbrev } }: LoaderFunctionArgs) {
	const { LEAGUE, teams, team, games } = getTeamAndGames(teamAbbrev)
	return json({ LEAGUE, teams, team, games })
}

export default function TeamCountdown() {
	const { teams, team, games } = useLoaderData<typeof loader>()
	const nextGame = games[0]

	return (
		<Countdown
			pageTitle={`${team.fullName} Countdown`}
			team={team}
			teams={teams}
			games={games}
			game={nextGame}
			isTeamPage={true}
		/>
	)
}
