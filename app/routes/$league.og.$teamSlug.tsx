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
		excludeSeconds: true,
	})

	const logoPath = `https://teamcountdown.com/logos/${
		LEAGUE === 'NFL' ? '' : `${LEAGUE.toLowerCase()}/`
	}${team.abbreviation.toLowerCase()}.svg`

	return new ImageResponse(
		(
			<div
				style={{
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
				{/* Main content: Logo + Countdown */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '1rem',
					}}
				>
					{/* Team Logo */}
					<img
						src={logoPath}
						width={500}
						height={500}
						style={{ marginLeft: '-5rem', objectFit: 'contain' }}
						alt={`${team.fullName} logo`}
					/>

					{/* Countdown Text */}
					<div style={{ fontSize: '4rem', textAlign: 'left' }}>
						{countdownString_}
					</div>
				</div>

				{/* Branding */}
				<div
					style={{
						position: 'absolute',
						bottom: '2rem',
						right: '3rem',
						fontSize: '2rem',
					}}
				>
					Team Countdown
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	)
}
