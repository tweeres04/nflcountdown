import { json, LoaderFunctionArgs } from '@remix-run/node'
import schedule from '../../nfl_schedule.json'
import mlbSchedule from '../../mlb_schedule.json'
import mlbTeams from '../../mlb_teams.json'
import nbaSchedule from '../../nba_schedule.json'
import { MetaFunction, useLoaderData } from '@remix-run/react'
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
import { addHours, isAfter, subHours, isWithinInterval } from 'date-fns'
import { Team } from '~/lib/types'
import { nbaGameToGame, nbaTeams, nbaTeamToTeam } from '~/lib/nbaGameToGame'

export const meta: MetaFunction = ({ data }) => {
	const { LEAGUE, team } = data as {
		LEAGUE: string
		team: Team
	}
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const title = `When is the next ${team.fullName} game? - ${LEAGUE} Countdown`
	const description = `The fastest and prettiest way to check the next ${team.fullName} game. Launches instantly from your home screen.`
	const ogImage = `https://${LEAGUE.toLowerCase()}countdown.tweeres.com/og/${LEAGUE.toLowerCase()}/${lowercaseAbbreviation}.png`
	const url = `https://${LEAGUE.toLowerCase()}countdown.tweeres.com/${lowercaseAbbreviation}`
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

export async function loader({ params: { teamAbbrev } }: LoaderFunctionArgs) {
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
	)
		.filter((g) => g.homeTeam.id === team.id || g.awayTeam.id === team.id)
		.filter((g) => {
			if (!g.time) {
				return true
			}
			const threeHrsAgo = subHours(new Date(), 3) // Handle a game in progress
			return isAfter(g.time, threeHrsAgo)
		})

	return json({ LEAGUE, teams, team, games })
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

export default function Countdown() {
	const LEAGUE = useContext(LeagueContext)
	useUpdateTime()
	const [showFullSchedule, setShowFullSchedule] = useState(false)
	const { teams, team, games } = useLoaderData<typeof loader>()
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const nextGame = games[0]
	const logo =
		LEAGUE === 'NFL'
			? `/logos/${lowercaseAbbreviation}.svg`
			: `/logos/${LEAGUE.toLowerCase()}/${lowercaseAbbreviation}.svg`

	const countdownString = nextGame.time
		? isWithinInterval(new Date(), {
				start: nextGame.time,
				end: addHours(nextGame.time, 3),
		  })
			? 'Game in progress!'
			: `${countdown(new Date(nextGame.time)).toString()} till the ${
					team.nickName
			  } play next`
		: 'Next game TBD'

	return (
		<>
			<div
				className={`font-sans text-white p-4 max-w-[500px] lg:max-w-[750px] mx-auto`}
			>
				<div className="flex gap-10">
					<h1 className="text-2xl grow">{team.fullName} Countdown</h1>
					<TeamsDropdown
						LEAGUE={LEAGUE}
						teams={teams}
						lowercaseAbbreviation={lowercaseAbbreviation}
					>
						<button className="px-3 py-2">Teams</button>
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
					{nextGame.time ? (
						<>
							<div className="text-3xl">{countdownString}</div>
							<div>
								<div>
									{new Intl.DateTimeFormat('en-US', {
										month: 'short',
										weekday: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
									}).format(new Date(nextGame.time))}
								</div>
								<div className="text-sm">
									vs{' '}
									{nextGame.homeTeam.abbreviation !== team.abbreviation
										? nextGame.homeTeam.fullName
										: nextGame.awayTeam.fullName}
								</div>
							</div>
						</>
					) : (
						<div className="text-3xl">Game time TBD</div>
					)}
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
					<Button
						onClick={() => {
							setShowFullSchedule((value) => !value)
						}}
					>
						{showFullSchedule ? 'Hide schedule' : 'Show full schedule'}{' '}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
							/>
						</svg>
					</Button>
				</div>
				{showFullSchedule ? (
					<ul className="space-y-5 mt-8">
						{games.map((g) => (
							<li key={g.id}>
								<div className="font-bold text-lg">
									{g.time
										? new Intl.DateTimeFormat('en-US', {
												dateStyle: 'full',
												timeStyle: 'short',
										  }).format(new Date(g.time))
										: 'TBD'}
								</div>{' '}
								{g.homeTeam.abbreviation === team.abbreviation ? 'vs' : 'at'}{' '}
								{g.homeTeam.abbreviation !== team.abbreviation
									? g.homeTeam.fullName
									: g.awayTeam.fullName}
							</li>
						))}
					</ul>
				) : null}
			</div>
			<InstallNotification
				lowercaseAbbreviation={lowercaseAbbreviation}
				fullTeamName={team.fullName}
			/>
		</>
	)
}
