import {
	useContext,
	useState,
	useEffect,
	useRef,
	Suspense,
	Fragment,
} from 'react'
import { Game, Team } from '~/lib/types'
import TeamsDropdown from './ui/teams-dropdown'
import { Button } from './ui/button'
import FeedbackButton from './feedback-button'
import InstallNotification from './install-notification'
import IosShareIcon from './IosShareIcon'
import { cn } from '~/lib/utils'
import { LeagueContext } from '~/lib/league-context'
import GameList from './game-list'
import YouMightLike from './you-might-like'
import { addHours, isPast, isWithinInterval } from 'date-fns'
import countdown from '../external/countdown'
import Markdown from 'react-markdown'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog'
import {
	Eye,
	ThumbsDown,
	ThumbsUp,
	Ticket,
	TrendingUp,
	ShoppingBag,
} from 'lucide-react'
import { Badge } from './ui/badge'
import { Await, Link } from '@remix-run/react'
import mixpanel from 'mixpanel-browser'
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from './ui/breadcrumb'
import type { BreadcrumbItem as BreadcrumbItemType } from '~/lib/schema-helpers'
import type { AffiliateLinks } from '~/lib/affiliate-links'

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
	team?: Team
	teams: Team[]
	games?: Game[]
	pageTitle: React.ReactNode
	game?: Game
	gamePreview?: Promise<string | null>
	isTeamPage?: boolean
	breadcrumbItems?: BreadcrumbItemType[]
	suggestedGames?: Game[]
	affiliateLinks?: AffiliateLinks
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
	game?: Game
	team?: Team
	isTeamPage: boolean
	LEAGUE: string
}) {
	if (!game) return 'No upcoming games'

	const countdownString = game?.time
		? isPast(addHours(game.time, 3))
			? 'Game completed'
			: isWithinInterval(new Date(), {
					start: game.time,
					end: addHours(game.time, 3),
			  })
			? 'Game in progress!'
			: `${countdown(new Date(game.time)).toString()} till ${
					isTeamPage && team
						? LEAGUE === 'CPL' || LEAGUE === 'MLS'
							? `${team.nickName} play next`
							: `the ${team.nickName} play next`
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
	games = [],
	pageTitle,
	game,
	gamePreview,
	isTeamPage = false,
	breadcrumbItems,
	suggestedGames = [],
	affiliateLinks,
}: CountdownProps) {
	const LEAGUE = useContext(LeagueContext)
	useUpdateTime()
	const [feedbackGiven, setFeedbackGiven] = useState(false)

	const [hasShareAPI, setHasShareAPI] = useState(true)
	useEffect(() => {
		setHasShareAPI(Boolean(navigator?.share))
	}, [])

	const countdownString_ = countdownString({ game, isTeamPage, LEAGUE, team })

	const [showFullSchedule, setShowFullSchedule] = useState(false)
	const lowercaseAbbreviation = team?.abbreviation?.toLowerCase()
	const logo = lowercaseAbbreviation
		? LEAGUE === 'NFL'
			? `/logos/${lowercaseAbbreviation}.svg`
			: `/logos/${LEAGUE.toLowerCase()}/${lowercaseAbbreviation}.svg`
		: `/logos/${LEAGUE.toLowerCase()}.svg`

	const gameDateInfo = game?.time ? (
		<div suppressHydrationWarning>
			{new Intl.DateTimeFormat('en-US', {
				month: 'short',
				weekday: 'short',
				day: 'numeric',
				hour: game.startTimeTbd ? undefined : 'numeric',
				minute: game.startTimeTbd ? undefined : 'numeric',
			}).format(new Date(game.time))}
			{game.startTimeTbd ? ', Time TBD' : ''}
		</div>
	) : null

	// Calculate opposing team for linking
	const opposingTeam =
		game?.homeTeam?.abbreviation !== team?.abbreviation
			? game?.homeTeam
			: game?.awayTeam

	const gameMatchupInfo =
		game?.awayTeam && game?.homeTeam && opposingTeam ? (
			<div className="text-sm" suppressHydrationWarning>
				vs{' '}
				<Link
					to={`/${LEAGUE.toLowerCase()}/${opposingTeam.abbreviation.toLowerCase()}`}
					className="content-link"
				>
					{opposingTeam.fullName}
				</Link>
			</div>
		) : null

	return (
		<>
			<div className="font-sans text-white p-4 max-w-[500px] lg:max-w-[750px] mx-auto pb-32">
				{/* Breadcrumb navigation */}
				{breadcrumbItems && breadcrumbItems.length > 0 && (
					<Breadcrumb className="mb-3">
						<BreadcrumbList className="text-white/70">
							{breadcrumbItems.map((item, index) => (
								<Fragment key={index}>
									<BreadcrumbItem>
										{item.href ? (
											<BreadcrumbLink
												href={item.href}
												className="hover:text-white"
											>
												{item.label}
											</BreadcrumbLink>
										) : (
											<BreadcrumbPage className="text-white font-normal">
												{item.label}
											</BreadcrumbPage>
										)}
									</BreadcrumbItem>
									{index < breadcrumbItems.length - 1 && (
										<BreadcrumbSeparator className="text-white/50" />
									)}
								</Fragment>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				)}

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
						'mx-auto',
						LEAGUE === 'NHL' || LEAGUE === 'CPL' || LEAGUE === 'MLS'
							? 'h-[256px] md:h-[384px] my-8'
							: 'w-[256px] h-[256px] md:w-[384px] md:h-[384px]',
						{ 'py-8 lg:py-16': LEAGUE === 'MLB' }
					)}
					alt={team ? `${team.fullName} logo` : `${LEAGUE} logo`}
				/>

				<div className="text-center space-y-2">
					<div className="text-3xl" suppressHydrationWarning>
						{countdownString_}
					</div>
					<div className="space-y-1">
						{gameDateInfo}
						{gameMatchupInfo}
						{game?.broadcast && (
							<div className="text-sm">Watch: {game.broadcast}</div>
						)}
					</div>
				</div>

				<div className="mt-8 [&_button]:min-w-[275px] flex flex-col gap-3 items-center">
					{hasShareAPI && (
						<Button
							onClick={() => {
								navigator
									.share({
										title: `${team?.fullName ?? 'NFL Season'} Countdown`,
										text: countdownString_,
										url: `${document.location.href}?utm_source=teamcountdown&utm_medium=share_button`,
									})
									.catch(() => {})
								mixpanel.track('click share button')
							}}
						>
							Share <IosShareIcon className="size-5" />
						</Button>
					)}
					<FeedbackButton />
					{gamePreview && (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									onClick={() => {
										mixpanel.track('Click game preview button')
									}}
								>
									Quick preview <Eye className="size-5" />
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
								<DialogTitle>
									<div>
										{game?.homeTeam && game?.awayTeam
											? `${game?.homeTeam?.fullName} vs ${game?.awayTeam?.fullName}`
											: 'Game preview'}
									</div>
									{game?.time ? (
										<div className="text-sm">
											{new Intl.DateTimeFormat('en-US', {
												month: 'short',
												weekday: 'short',
												day: 'numeric',
												hour: game.startTimeTbd ? undefined : 'numeric',
												minute: game.startTimeTbd ? undefined : 'numeric',
											}).format(new Date(game.time))}
										</div>
									) : null}
								</DialogTitle>
								<Suspense fallback={<GamePreviewLoading />}>
									<Await resolve={gamePreview}>
										{(preview) =>
											preview ? (
												<>
													<Markdown>{preview}</Markdown>
													<DialogFooter>
														{feedbackGiven ? (
															<div>
																<p className="text-center font-medium">
																	Thanks for your feedback!
																</p>
																<p className="text-[.75rem]">
																	If you want to tell me more, use the Feedback
																	button
																</p>
															</div>
														) : (
															<>
																<Button
																	onClick={() => {
																		mixpanel.track('click thumbs down')
																		setFeedbackGiven(true)
																	}}
																>
																	<ThumbsDown />
																</Button>
																<Button
																	onClick={() => {
																		mixpanel.track('click thumbs up')
																		setFeedbackGiven(true)
																	}}
																>
																	<ThumbsUp />
																</Button>
															</>
														)}
													</DialogFooter>
												</>
											) : (
												<p>Game preview unavailable</p>
											)
										}
									</Await>
								</Suspense>
							</DialogContent>
						</Dialog>
					)}
					{games.length > 0 ? (
						<Button
							onClick={() => {
								mixpanel.track(
									showFullSchedule
										? 'click hide full schedule'
										: 'click show full schedule'
								)
								setShowFullSchedule((v) => !v)
							}}
						>
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

				{showFullSchedule && team && <GameList games={games} team={team} />}

				{affiliateLinks?.tickets ||
				affiliateLinks?.betting ||
				affiliateLinks?.merch ? (
					<div className="flex gap-3 mt-10 justify-center">
						{affiliateLinks.tickets && (
							<Button variant="affiliate" asChild size="sm">
								<a
									href={affiliateLinks.tickets}
									target="_blank"
									rel="noopener noreferrer sponsored"
								>
									Tickets <Ticket className="size-4" />
								</a>
							</Button>
						)}
						{affiliateLinks.betting && (
							<Button variant="affiliate" asChild size="sm">
								<a
									href={affiliateLinks.betting}
									target="_blank"
									rel="noopener noreferrer sponsored"
								>
									Bet <TrendingUp className="size-4" />
								</a>
							</Button>
						)}
						{affiliateLinks.merch && (
							<Button variant="affiliate" asChild size="sm">
								<a
									href={affiliateLinks.merch}
									target="_blank"
									rel="noopener noreferrer sponsored"
								>
									Gear <ShoppingBag className="size-4" />
								</a>
							</Button>
						)}
					</div>
				) : null}

				{suggestedGames.length > 0 && (
					<YouMightLike games={suggestedGames} league={LEAGUE} />
				)}
			</div>
			<InstallNotification
				className={
					lowercaseAbbreviation
						? LEAGUE === 'NFL'
							? `bg-${lowercaseAbbreviation}`
							: `bg-${LEAGUE.toLowerCase()}-${lowercaseAbbreviation}`
						: 'bg-[#013369]'
				}
				countdownName={team?.fullName ?? `${LEAGUE} Season`}
			/>
		</>
	)
}
