import { useContext, useState, useEffect, useRef, Suspense } from 'react'
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
import Markdown from 'react-markdown'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Eye } from 'lucide-react'
import { Badge } from './ui/badge'
import { Await } from '@remix-run/react'

// Simple inline loading skeleton for Dialog
const GamePreviewLoading = () => (
	<div className="space-y-2">
		{[1, 2, 3].map((i) => (
			<div key={i} className="flex items-start gap-2">
				<span className="text-white/30">•</span>
				<div className="flex-1">
					<div className="h-3 bg-white/20 rounded w-full mb-1 animate-pulse" />
					<div className="h-3 bg-white/10 rounded w-3/4 animate-pulse" />
				</div>
			</div>
		))}
	</div>
)

interface CountdownProps {
	team: Team
	teams: Team[]
	games: Game[]
	pageTitle: React.ReactNode
	game: Game
	gamePreview?: Promise<string | null>
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

export function countdownString({
	game,
	team,
	isTeamPage,
	LEAGUE,
}: {
	game: Game
	team: Team
	isTeamPage: boolean
	LEAGUE: string
}) {
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
	return countdownString
}

export default function Countdown({
	team,
	teams,
	games,
	pageTitle,
	game,
	gamePreview,
	isTeamPage = false,
}: CountdownProps) {
	const LEAGUE = useContext(LeagueContext)
	useUpdateTime()

	const countdownString_ = countdownString({ game, isTeamPage, LEAGUE, team })

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
					hour: game.startTimeTbd ? undefined : 'numeric',
					minute: game.startTimeTbd ? undefined : 'numeric',
				}).format(new Date(game.time))}
				{game.startTimeTbd ? ', Time TBD' : ''}
			</div>
			{game.awayTeam && game.homeTeam ? (
				<div className="text-sm">
					vs{' '}
					{game.homeTeam.abbreviation !== team?.abbreviation
						? game.homeTeam.fullName
						: game.awayTeam.fullName}
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
						'w-[256px] h-[256px] md:w-[384px] md:h-[384px] mx-auto',
						{ 'py-8 lg:py-16': LEAGUE === 'MLB' }
					)}
					alt={team ? `${team.fullName} logo` : 'NFL logo'}
				/>

				<div className="text-center space-y-2">
					<div className="text-3xl">{countdownString_}</div>
					{gameInfo}
				</div>

				<div className="mt-8 space-y-3 [&_button]:min-w-[250px]">
					{typeof navigator !== 'undefined' && navigator.share && (
						<Button
							onClick={() => {
								navigator
									.share({
										title: `${team?.fullName ?? 'NFL Season'} Countdown`,
										text: countdownString_,
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
					{gamePreview && (
						<Dialog>
							<DialogTrigger asChild>
								<Button>
									Game preview <Eye className="size-5" />{' '}
									<Badge
										className={cn(
											lowercaseAbbreviation
												? LEAGUE === 'NFL'
													? `bg-${lowercaseAbbreviation} hover:bg-${lowercaseAbbreviation}-secondary`
													: `bg-${LEAGUE.toLowerCase()}-${lowercaseAbbreviation} hover:bg-${LEAGUE.toLowerCase()}-${lowercaseAbbreviation}-secondary`
												: undefined
										)}
									>
										New
									</Badge>
								</Button>
							</DialogTrigger>
							<DialogContent
								className={cn(
									'p-4 text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-3 border-0 rounded-lg',
									lowercaseAbbreviation
										? LEAGUE === 'NFL'
											? `bg-${lowercaseAbbreviation}`
											: `bg-${LEAGUE.toLowerCase()}-${lowercaseAbbreviation}`
										: 'bg-[#013369]'
								)}
							>
								<Suspense fallback={<GamePreviewLoading />}>
									<Await resolve={gamePreview}>
										{(preview) =>
											preview ? (
												<Markdown>{preview}</Markdown>
											) : (
												<p>Game preview unavailable</p>
											)
										}
									</Await>
								</Suspense>
							</DialogContent>
						</Dialog>
					)}
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
