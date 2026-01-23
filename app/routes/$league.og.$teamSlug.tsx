import { LoaderFunctionArgs } from '@remix-run/node'
import { ImageResponse } from '@vercel/og'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { addHours, isFuture } from 'date-fns'
import type { Game } from '~/lib/types'
import { countdownString } from '~/components/countdown'

export async function loader({
	params: { league, teamSlug },
}: LoaderFunctionArgs) {
	const { LEAGUE, team, games } = await getTeamAndGames(league, teamSlug)

	// Find the next upcoming game
	const game = games.filter(
		(g: Game) => g.time && isFuture(addHours(new Date(g.time), 3))
	)[0]

	const countdownString_ = countdownString({
		game,
		team,
		isTeamPage: true,
		LEAGUE,
	})

	return new ImageResponse(
		(
			<div
				style={{
					textAlign: 'center',
					fontSize: '5rem',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					width: '100%',
					height: '100%',
					background: `linear-gradient(to bottom, ${team.primaryColor}, ${team.secondaryColor})`,
					color: 'white',
					padding: '0 5rem',
				}}
			>
				{countdownString_}
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	)
}
