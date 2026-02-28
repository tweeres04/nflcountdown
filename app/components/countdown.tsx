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
import Microsurvey from './microsurvey'
import IosShareIcon from './IosShareIcon'
import { cn } from '~/lib/utils'
import { LeagueContext } from '~/lib/league-context'
import GameList from './game-list'
import YouMightLike from './you-might-like'
import { getGameSlug } from '~/lib/getGameSlug'
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
import { Calendar, Eye, Menu, ThumbsDown, ThumbsUp, Ticket } from 'lucide-react'
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
import type { AffiliateLinks } from '~/lib/cj-service'

const AffiliateLinksLoading = () => (
	<div className="flex gap-3 mt-10 justify-center">
		<div className="h-9 w-24" />
	</div>
)

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
	affiliateLinks?: Promise<AffiliateLinks | null>
	teamPickerTeams?: Team[]
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
	excludeSeconds = false,
}: {
	game?: Game
	team?: Team
	isTeamPage: boolean
	LEAGUE: string
	excludeSeconds?: boolean
}) {
	if (!game) return 'No upcoming games'

	const units = excludeSeconds
		? countdown.DAYS | countdown.HOURS | countdown.MINUTES
		: undefined

	const countdownString = game?.time
		? isPast(addHours(game.time, 3))
			? 'Game completed'
			: isWithinInterval(new Date(), {
					start: game.time,
					end: addHours(game.time, 3),
			  })
			? 'Game in progress!'
			: `${countdown(new Date(game.time), null, units).toString()} till ${
					isTeamPage && team
						? LEAGUE === 'CPL' || LEAGUE === 'MLS'
							? `${team.nickName} play next`
							: `the ${team.nickName} play next`
						: LEAGUE === 'NFL' || LEAGUE === 'MLS' || LEAGUE === 'CPL'
						? 'kickoff'
						: LEAGUE === 'MLB'
						? 'first pitch'
						: LEAGUE === 'NHL'
						? 'puck drop'
						: 'tip-off'
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
	teamPickerTeams,
}: CountdownProps) {
	const LEAGUE = useContext(LeagueContext)
	useUpdateTime()
	const [feedbackGiven, setFeedbackGiven] = useState(false)

	const [hasShareAPI, setHasShareAPI] = useState(true)
	const [copied, setCopied] = useState(false)
	useEffect(() => {
		setHasShareAPI(Boolean(navigator?.share))
	}, [])

	const countdownString_ = countdownString({ game, isTeamPage, LEAGUE, team })
	const shareTitle = countdownString({
		game,
		isTeamPage,
		LEAGUE,
		team,
		excludeSeconds: true,
	})
	const UNSHAREABLE = ['Game completed', 'No upcoming games', 'Game time TBD']
	const canShare = !UNSHAREABLE.includes(shareTitle)

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
							<Menu className="size-6" />
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
				{canShare && (
					<Button
						onClick={() => {
							const shareUrl = `${document.location.href}?utm_source=teamcountdown&utm_medium=share_button`
							const trackingProps = {
								team: team?.fullName ?? null,
								league: LEAGUE,
								page_type: isTeamPage ? 'team' : 'game',
								method: hasShareAPI ? 'native_share' : 'copy_link',
							}
							mixpanel.track('click share button', trackingProps)
							if (hasShareAPI) {
								navigator
									.share({
										title: shareTitle,
										url: shareUrl,
									})
									.then(() => {
										mixpanel.track('share completed', trackingProps)
									})
									.catch(() => {})
							} else {
								navigator.clipboard
									.writeText(shareUrl)
									.then(() => {
										setCopied(true)
										setTimeout(() => setCopied(false), 2000)
										mixpanel.track('share completed', trackingProps)
									})
									.catch(() => {})
							}
						}}
					>
						{hasShareAPI ? (
							<>Share <IosShareIcon className="size-5" /></>
						) : copied ? 'Copied!' : 'Copy link'}
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
									<Await resolve={gamePreview} errorElement={null}>
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
						<>
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
								<Calendar className="size-5" />
							</Button>

							{/* Hidden navigation for SEO and screen readers - includes all game schedule links */}
							{team && (
								<nav className="sr-only" aria-label="Full schedule">
									{games
										.filter((g) => g.time && new Date(g.time) > new Date())
										.map((g) => {
											const gameSlug = getGameSlug(g, team.abbreviation)
											const gameDate = g.time
												? new Intl.DateTimeFormat('en-US', {
														month: 'short',
														day: 'numeric',
														year: 'numeric',
												  }).format(new Date(g.time))
												: ''
											return gameSlug ? (
												<a
													key={g.id}
													href={`/${LEAGUE.toLowerCase()}/${team.abbreviation.toLowerCase()}/${gameSlug}`}
												>
													{g.homeTeam?.fullName} vs {g.awayTeam?.fullName}
													{gameDate && ` - ${gameDate}`}
												</a>
											) : null
										})}
								</nav>
							)}
						</>
					) : null}
				</div>

				{showFullSchedule && team && <GameList games={games} team={team} />}

				{teamPickerTeams && teamPickerTeams.length > 0 && (
					<div className="mt-10 space-y-3">
						<h2 className="text-xl">Pick your team. Get your countdown.</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{teamPickerTeams.map((t) => (
								<Link
									key={t.abbreviation}
									to={`/${LEAGUE.toLowerCase()}/${t.abbreviation.toLowerCase()}`}
									className="flex items-center gap-4 py-2 content-link group"
									onClick={() =>
										mixpanel.track('click team from season page', {
											team: t.fullName,
										})
									}
								>
									<img
										src={`/logos/${
											LEAGUE === 'NFL' ? '' : `${LEAGUE.toLowerCase()}/`
										}${t.abbreviation.toLowerCase()}.svg`}
										alt={`${t.fullName} logo`}
										className="h-10 w-10 object-contain flex-shrink-0"
									/>
									<div className="text-base font-semibold text-white">
										{t.fullName}
									</div>
								</Link>
							))}
						</div>
					</div>
				)}

				{affiliateLinks ? (
					<Suspense fallback={<AffiliateLinksLoading />}>
						<Await resolve={affiliateLinks} errorElement={null}>
							{(links) =>
							links?.tickets ? (
								<div className="flex gap-3 mt-10 justify-center animate-in fade-in duration-300">
										<Button variant="affiliate" asChild size="sm">
											<a
												href={links.tickets}
												target="_blank"
												rel="noopener noreferrer sponsored"
												onClick={() => {
													mixpanel.track('click ticket link', {
														team: team?.fullName,
														opponent: opposingTeam?.fullName,
														page: isTeamPage ? 'team' : 'game',
													})
												}}
											>
												Tickets <Ticket className="size-4" />
											</a>
										</Button>
									</div>
								) : null
							}
						</Await>
					</Suspense>
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
			<Microsurvey />
		</>
	)
}
