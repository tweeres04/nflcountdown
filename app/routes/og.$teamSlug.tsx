import { LoaderFunctionArgs } from '@remix-run/node'
import { ImageResponse } from '@vercel/og'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { addHours, isFuture } from 'date-fns'
import type { Game } from '~/lib/types'
import { countdownString } from '~/components/countdown'

import schedule from '../../nfl_schedule.json'
import mlbColors from '../../mlb_colors.json'
import nbaColors from '../../nba_colors.json'

const nflTeams = [...new Set(schedule.games.map((g) => g.homeTeam))]

type ColorObject = Record<string, { DEFAULT: string; secondary: string }>

const nflColors: ColorObject = nflTeams.reduce(
	(result, t) => ({
		...result,
		[t.abbreviation.toLowerCase()]: {
			DEFAULT: t.primaryColor,
			secondary: t.secondaryColor,
		},
	}),
	{}
)

const mlbColors_: ColorObject = mlbColors.reduce(
	(result, c) => ({
		...result,
		[c.abbreviation.toLowerCase()]: {
			DEFAULT: c.color_1,
			secondary: c.color_2,
		},
	}),
	{}
)
const nbaColors_: ColorObject = nbaColors.reduce(
	(result, c) => ({
		...result,
		[c.abbreviation.toLowerCase()]: {
			DEFAULT: c.color_1,
			secondary: c.color_2,
		},
	}),
	{}
)

export async function loader({ params }: LoaderFunctionArgs) {
	// Try to detect league from team abbreviation across all leagues
	let LEAGUE: string | undefined
	let team
	let games

	// Try NFL first
	try {
		const result = await getTeamAndGames('nfl', params.teamSlug)
		LEAGUE = result.LEAGUE
		team = result.team
		games = result.games
	} catch {
		// Try NBA
		try {
			const result = await getTeamAndGames('nba', params.teamSlug)
			LEAGUE = result.LEAGUE
			team = result.team
			games = result.games
		} catch {
			// Try MLB
			try {
				const result = await getTeamAndGames('mlb', params.teamSlug)
				LEAGUE = result.LEAGUE
				team = result.team
				games = result.games
			} catch {
				throw new Response(null, { status: 404 })
			}
		}
	}

	if (!LEAGUE || !team || !games) {
		throw new Response(null, { status: 404 })
	}

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

	const teamColours =
		LEAGUE === 'NFL'
			? nflColors[team.abbreviation.toLowerCase()]
			: LEAGUE === 'NBA'
			? nbaColors_[team.abbreviation.toLowerCase()]
			: mlbColors_[team.abbreviation.toLowerCase()]

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
					background: `linear-gradient(to bottom, ${teamColours.DEFAULT}, ${teamColours.secondary})`,
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
