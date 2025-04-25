import { useContext, useState, useEffect, useRef } from 'react'
import { Game, Team } from '~/lib/types'
import TeamsDropdown from './ui/teams-dropdown'
import { Button } from './ui/button'
import FeedbackButton from './feedback-button'
import InstallNotification from './install-notification'
import IosShareIcon from './IosShareIcon'
import { cn } from '~/lib/utils'
import { LeagueContext } from '~/lib/league-context'
import GameList from './game-list'
import { addHours, isPast, isWithinInterval } from 'date-fns'
import countdown from '../external/countdown'

interface CountdownProps {
	team: Team
	teams: Team[]
	games: Game[]
	pageTitle: React.ReactNode
	game: Game
	isTeamPage?: boolean
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

export default function Countdown({
	team,
	teams,
	games,
	pageTitle,
	game,
	isTeamPage = false,
}: CountdownProps) {
	const LEAGUE = useContext(LeagueContext)
	useUpdateTime()

	const countdownString = game?.time
		? isPast(addHours(game.time, 3))
			? 'Game completed'
			: isWithinInterval(new Date(), {
					start: game.time,
					end: addHours(game.time, 3),
			  })
			? 'Game in progress!'
			: `${countdown(new Date(game.time)).toString()} till ${
					isTeamPage
						? `the ${team.nickName} play next`
						: LEAGUE === 'NFL'
						? 'kickoff'
						: LEAGUE === 'MLB'
						? 'first pitch'
						: 'tipoff'
			  }`
		: 'Game time TBD'

	const [showFullSchedule, setShowFullSchedule] = useState(false)
	const lowercaseAbbreviation = team?.abbreviation?.toLowerCase()
	const logo =
		LEAGUE === 'NFL'
			? `/logos/${lowercaseAbbreviation ?? 'nfl'}.svg`
			: `/logos/${LEAGUE.toLowerCase()}/${lowercaseAbbreviation}.svg`

	const gameInfo = game?.time ? (
		<div>
			<div>
				{new Intl.DateTimeFormat('en-US', {
					month: 'short',
					weekday: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
				}).format(new Date(game.time))}
			</div>
			{game.awayTeam ? (
				<div className="text-sm">
					vs{' '}
					{game.homeTeam?.abbreviation !== team?.abbreviation
						? game.homeTeam.fullName
						: game.awayTeam?.fullName}
				</div>
			) : null}
		</div>
	) : null

	return (
		<>
			<div className="font-sans text-white p-4 max-w-[500px] lg:max-w-[750px] mx-auto">
				<div className="flex gap-10">
					<h1 className="text-2xl grow">{pageTitle}</h1>
					<TeamsDropdown
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
					alt={team ? `${team.fullName} logo` : 'NFL logo'}
				/>

				<div className="text-center space-y-2">
					<div className="text-3xl">{countdownString}</div>
					{gameInfo}
				</div>

				<div className="mt-8 space-y-3 [&_button]:min-w-[250px]">
					{typeof navigator !== 'undefined' && navigator.share && (
						<Button
							onClick={() => {
								navigator
									.share({
										title: `${team?.fullName ?? 'NFL Season'} Countdown`,
										text: countdownString,
										url: `${
											document.location.href
										}?utm_source=${LEAGUE.toLowerCase()}countdown&utm_medium=share_button`,
									})
									.catch(() => {})
							}}
						>
							Share <IosShareIcon className="size-5" />
						</Button>
					)}
					<FeedbackButton />
					{games?.length > 0 ? (
						<Button onClick={() => setShowFullSchedule((v) => !v)}>
							{showFullSchedule ? 'Hide schedule' : 'Show full schedule'}
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
					) : null}
				</div>

				{showFullSchedule && <GameList games={games} team={team} />}
			</div>
			<InstallNotification
				className={
					lowercaseAbbreviation
						? LEAGUE === 'NFL'
							? `bg-${lowercaseAbbreviation}`
							: `bg-${LEAGUE.toLowerCase()}-${lowercaseAbbreviation}`
						: 'bg-[#013369]'
				}
				countdownName={team?.fullName ?? 'NFL Season'}
			/>
		</>
	)
}
