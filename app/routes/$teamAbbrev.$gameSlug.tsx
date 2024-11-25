import { json, LoaderFunctionArgs } from '@remix-run/node'
import { MetaFunction, useLoaderData } from '@remix-run/react'
import schedule from '../../nfl_schedule.json'
import mlbSchedule from '../../mlb_schedule.json'
import mlbTeams from '../../mlb_teams.json'
import nbaSchedule from '../../nba_schedule.json'
import { useContext, useEffect, useRef, useState } from 'react'
import countdown from '../external/countdown'
import { uniqBy, orderBy } from 'lodash-es'

import TeamsDropdown from '~/components/ui/teams-dropdown'
import InstallNotification from '~/components/install-notification'
import IosShareIcon from '~/components/IosShareIcon'
import { Button } from '~/components/ui/button'
import FeedbackButton from '~/components/feedback-button'
import { mlbGameToGame, mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { LeagueContext } from '~/lib/league-context'
import { cn } from '~/lib/utils'
import { addHours, isWithinInterval } from 'date-fns'
import { Team } from '~/lib/types'
import { nbaGameToGame, nbaTeams, nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { getGameSlug } from '~/lib/getGameSlug'

export const meta: MetaFunction = ({ data, params }) => {
	const { LEAGUE, team, game } = data as {
		LEAGUE: string
		team: Team
		game: any
	}
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const opponent =
		game.homeTeam.abbreviation !== team.abbreviation
			? game.homeTeam.fullName
			: game.awayTeam.fullName

	const gameDateFormatted = game.time
		? new Intl.DateTimeFormat('en-US', {
				dateStyle: 'medium',
		  }).format(new Date(game.time))
		: ''
	const gameDateStringForTitle = game.time ? ` - ${gameDateFormatted}` : ''
	const gameDateStringForDescription = game.time
		? ` on ${gameDateFormatted}`
		: ''

	const title = `${team.fullName} vs ${opponent}${gameDateStringForTitle} - ${LEAGUE} Countdown`
	const description = `Countdown to ${team.fullName} vs ${opponent}${gameDateStringForDescription}. Launches instantly from your home screen.`

	const ogImage = `https://${LEAGUE.toLowerCase()}countdown.tweeres.com/og/${LEAGUE.toLowerCase()}/${lowercaseAbbreviation}.png`
	const url = `https://${LEAGUE.toLowerCase()}countdown.tweeres.com/${
		params.teamAbbrev
	}/${params.gameSlug}`
	return [
		{ title },
		{
			name: 'description',
			content: description,
		},
		{ name: 'theme-color', content: team.primaryColor },
		{ name: 'og:title', content: title },
		{ name: 'og:type', content: 'website' },
		{
			name: 'og:url',
			content: url,
		},
		{
			name: 'og:image',
			content: ogImage,
		},
		{
			name: 'og:description',
			content: description,
		},
		{ name: 'og:site_name', content: `${LEAGUE} Countdown` },
		{
			tagName: 'link',
			rel: 'canonical',
			href: url,
		},
	]
}

export async function loader({
	params: { teamAbbrev, gameSlug },
}: LoaderFunctionArgs) {
	const LEAGUE = process.env.LEAGUE ?? 'NFL'
	let teams =
		LEAGUE === 'MLB'
			? mlbTeams.teams.map(mlbTeamToTeam)
			: LEAGUE === 'NBA'
			? nbaTeams.map(nbaTeamToTeam)
			: uniqBy(
					schedule.games.map((g) => g.homeTeam),
					'id'
			  )
	teams = orderBy(teams, 'fullName')

	const team = teams.find(
		(t) => t.abbreviation.toLowerCase() === teamAbbrev?.toLowerCase()
	)

	if (!team) {
		throw new Response(null, { status: 404 })
	}

	const games = (
		LEAGUE === 'MLB'
			? mlbSchedule.dates.flatMap((d) => d.games).map(mlbGameToGame)
			: LEAGUE === 'NBA'
			? nbaSchedule.leagueSchedule.gameDates
					.flatMap((gd) => gd.games)
					.filter((g) => g.homeTeam.teamId > 0)
					.map(nbaGameToGame)
			: schedule.games
	).filter((g) => g.homeTeam.id === team.id || g.awayTeam.id === team.id)

	const game = games.find((g) => {
		if (!g.time) return false
		const expectedSlug = getGameSlug(g, team.abbreviation)
		return expectedSlug === gameSlug
	})

	if (!game) {
		throw new Response(null, { status: 404 })
	}

	return json({ LEAGUE, teams, team, game })
}

function useUpdateTime() {
	const [, setCurrentTime] = useState(new Date())
	const intervalHandleRef = useRef<NodeJS.Timeout>()

	useEffect(() => {
		intervalHandleRef.current = setInterval(() => {
			setCurrentTime(new Date())
		}, 1000)

		return () => {
			clearInterval(intervalHandleRef.current)
		}
	}, [])
}

export default function GameCountdown() {
	const LEAGUE = useContext(LeagueContext)
	useUpdateTime()
	const { teams, team, game } = useLoaderData<typeof loader>()
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const logo =
		LEAGUE === 'NFL'
			? `/logos/${lowercaseAbbreviation}.svg`
			: `/logos/${LEAGUE.toLowerCase()}/${lowercaseAbbreviation}.svg`

	const countdownString = game?.time
		? isWithinInterval(new Date(), {
				start: game.time,
				end: addHours(game.time, 3),
		  })
			? 'Game in progress!'
			: `${countdown(new Date(game.time)).toString()} till ${
					LEAGUE === 'NFL'
						? 'kickoff'
						: LEAGUE === 'MLB'
						? 'first pitch'
						: 'tipoff'
			  }`
		: 'Game time TBD'

	return (
		<>
			<div className="font-sans text-white p-4 max-w-[500px] lg:max-w-[750px] mx-auto">
				<div className="flex gap-10">
					<h1 className="text-2xl grow">
						{team.fullName} vs{' '}
						{game.homeTeam.abbreviation !== team.abbreviation
							? game.homeTeam.fullName
							: game.awayTeam.fullName}
					</h1>
					<TeamsDropdown
						LEAGUE={LEAGUE}
						teams={teams}
						lowercaseAbbreviation={lowercaseAbbreviation}
					>
						<button className="px-3 py-2 flex gap-1">
							<span className="hidden lg:inline">Teams</span>{' '}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								/>
							</svg>
						</button>
					</TeamsDropdown>
				</div>

				<img
					src={logo}
					className={cn(
						'w-[256px] h-[256px] lg:w-[512px] lg:h-[512px] mx-auto',
						{ 'py-8 lg:py-16': LEAGUE === 'MLB' }
					)}
					alt={`${team.fullName} logo`}
				/>

				<div className="text-center space-y-2">
					<div className="text-3xl">{countdownString}</div>
					<div>
						{game.time && (
							<div>
								{new Intl.DateTimeFormat('en-US', {
									dateStyle: 'full',
									timeStyle: 'short',
								}).format(new Date(game.time))}
							</div>
						)}
					</div>
				</div>

				<div className="mt-8 space-y-3">
					{typeof navigator !== 'undefined' && navigator.share ? (
						<Button
							onClick={() => {
								navigator
									.share({
										title: `${team.fullName} Countdown`,
										text: countdownString,
										url: `${
											document.location.href
										}?utm_source=${LEAGUE.toLowerCase()}countdown&utm_medium=share_button`,
									})
									.catch((err) => {
										// Swallow so we don't send to sentry
									})
							}}
						>
							Share <IosShareIcon className="size-5" />
						</Button>
					) : null}
					<FeedbackButton />
				</div>
			</div>
			<InstallNotification
				lowercaseAbbreviation={lowercaseAbbreviation}
				fullTeamName={team.fullName}
			/>
		</>
	)
}
