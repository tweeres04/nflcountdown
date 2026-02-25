import { json, type MetaFunction, LoaderFunctionArgs } from '@remix-run/node'
import { uniqBy, orderBy } from 'lodash-es'
import { Link, useLoaderData } from '@remix-run/react'
import mlbTeams from '../../mlb_teams.json'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplTeamToTeam } from '~/lib/cplGameToGame'
import { mlsTeamToTeam } from '~/lib/mlsGameToGame'
import { readFile } from 'node:fs/promises'
import {
	NbaScheduleApi,
	NflScheduleApi,
	NhlScheduleApi,
	WnbaScheduleApi,
	CplScheduleApi,
	MlsScheduleApi,
	Team,
} from '~/lib/types'
import {
	generateSportsOrganizationSchema,
	generateBreadcrumbSchema,
} from '~/lib/schema-helpers'
import Footer from '~/components/footer'
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { getSuggestedGames } from '~/lib/getSuggestedGames'
import UpcomingGames from '~/components/upcoming-games'
import Countdown from '~/components/countdown'
import { getSeasonStartDate } from '~/lib/getSeasonStartDate'

interface LeagueMeta {
	fullName: string
	shortName: string
	seasonTerm: string // e.g. "kickoff", "opening day", "puck drop", "tip-off"
	titleKeyword: string // e.g. "NFL Kickoff", "MLB Opening Day"
	crossYear: boolean // true for leagues whose season spans two calendar years (NBA, NHL)
	teamCount: number // for static FAQ entries
	seasonLength: string // e.g. "18 weeks", "162 games per team"
	seasonMonths: string // e.g. "September to February", "October to June"
}

const LEAGUE_META: Record<string, LeagueMeta> = {
	NFL: {
		fullName: 'National Football League',
		shortName: 'NFL',
		seasonTerm: 'kickoff',
		titleKeyword: 'NFL Kickoff',
		crossYear: false,
		teamCount: 32,
		seasonLength: '18 weeks',
		seasonMonths: 'September to January',
	},
	MLB: {
		fullName: 'Major League Baseball',
		shortName: 'MLB',
		seasonTerm: 'opening day',
		titleKeyword: 'MLB Opening Day',
		crossYear: false,
		teamCount: 30,
		seasonLength: '162 games per team',
		seasonMonths: 'March to October',
	},
	NBA: {
		fullName: 'National Basketball Association',
		shortName: 'NBA',
		seasonTerm: 'tip-off',
		titleKeyword: 'NBA Season',
		crossYear: true,
		teamCount: 30,
		seasonLength: '82 games per team',
		seasonMonths: 'October to June',
	},
	NHL: {
		fullName: 'National Hockey League',
		shortName: 'NHL',
		seasonTerm: 'puck drop',
		titleKeyword: 'NHL Season',
		crossYear: true,
		teamCount: 32,
		seasonLength: '82 games per team',
		seasonMonths: 'October to June',
	},
	WNBA: {
		fullName: "Women's National Basketball Association",
		shortName: 'WNBA',
		seasonTerm: 'tip-off',
		titleKeyword: 'WNBA Season',
		crossYear: false,
		teamCount: 13,
		seasonLength: '40 games per team',
		seasonMonths: 'May to September',
	},
	MLS: {
		fullName: 'Major League Soccer',
		shortName: 'MLS',
		seasonTerm: 'kickoff',
		titleKeyword: 'MLS Season',
		crossYear: false,
		teamCount: 30,
		seasonLength: '34 games per team',
		seasonMonths: 'February to November',
	},
	CPL: {
		fullName: 'Canadian Premier League',
		shortName: 'CPL',
		seasonTerm: 'kickoff',
		titleKeyword: 'CPL Season',
		crossYear: false,
		teamCount: 8,
		seasonLength: '28 games per team',
		seasonMonths: 'April to October',
	},
}

function formatSeasonYear(year: number, crossYear: boolean): string {
	if (crossYear) {
		return `${year}-${String(year + 1).slice(2)}`
	}
	return String(year)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const LEAGUE = data?.LEAGUE ?? 'NFL'
	const lowercaseLeague = LEAGUE.toLowerCase()
	const meta = LEAGUE_META[LEAGUE]
	const isMidSeason = data?.isMidSeason ?? false
	const seasonYear = data?.seasonYear ?? String(new Date().getFullYear())
	const seasonStartDate = data?.seasonStartDate
	const url = `https://teamcountdown.com/${lowercaseLeague}`
	const ogImage = LEAGUE === 'NFL' ? 'og.png' : `${lowercaseLeague}-og.png`

	const title = isMidSeason
		? `${LEAGUE} Countdown | Live Game Countdowns for Every Team`
		: `How Many Days Till ${
				meta?.titleKeyword ?? LEAGUE + ' Season'
		  }? Live ${LEAGUE} Season Countdown`

	const description = isMidSeason
		? `The ${seasonYear} ${LEAGUE} season is underway. Pick your team and count down to their next game.`
		: `Find out exactly how many days until ${LEAGUE} season starts. Live countdown showing the precise days, hours, and minutes until ${
				meta?.fullName ?? LEAGUE
		  } ${meta?.seasonTerm ?? 'kickoff'} in ${seasonYear}.`

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: LEAGUE },
	]

	const seasonStartFormatted = seasonStartDate
		? new Date(seasonStartDate).toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
		  })
		: ''

	const seasonStartFormattedShort = seasonStartDate
		? new Date(seasonStartDate).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
		  })
		: ''

	// Next season year for mid-season references
	const nextSeasonStartYear = isMidSeason
		? meta?.crossYear
			? new Date().getFullYear()
			: new Date().getFullYear() + 1
		: null
	const nextSeasonYear = nextSeasonStartYear
		? formatSeasonYear(nextSeasonStartYear, meta?.crossYear ?? false)
		: null

	const faqEntities = [
		// Q1+Q2: same questions, conditional answers
		{
			'@type': 'Question',
			name: `How many days until the ${LEAGUE} season starts?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: isMidSeason
					? `The ${seasonYear} ${LEAGUE} season has already started. The next season is expected to begin in ${
							meta?.seasonMonths?.split(' to ')[0] ?? 'fall'
					  } ${nextSeasonYear}. Pick your team above to count down to their next game.`
					: `The ${seasonYear} ${LEAGUE} season starts on ${seasonStartFormattedShort}. Use the live countdown above for the exact days, hours, minutes, and seconds remaining.`,
			},
		},
		{
			'@type': 'Question',
			name: `When does the ${LEAGUE} season start?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: isMidSeason
					? `The current ${LEAGUE} season began in ${
							meta?.seasonMonths?.split(' to ')[0] ?? 'fall'
					  } ${seasonYear}. The next ${LEAGUE} season is expected to start in ${
							meta?.seasonMonths?.split(' to ')[0] ?? 'fall'
					  } ${nextSeasonYear}.`
					: `${LEAGUE} ${
							meta?.seasonTerm ?? 'kickoff'
					  } is on ${seasonStartFormatted}.`,
			},
		},
		// Q3+Q4: static evergreen entries
		{
			'@type': 'Question',
			name: `How many teams are in the ${LEAGUE}?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: `The ${meta?.fullName ?? LEAGUE} has ${
					meta?.teamCount ?? ''
				} teams.`,
			},
		},
		{
			'@type': 'Question',
			name: `How long is the ${LEAGUE} season?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: `The ${LEAGUE} regular season runs ${
					meta?.seasonLength ?? ''
				}, typically from ${meta?.seasonMonths ?? ''}.`,
			},
		},
	]

	const metaTags: any[] = [
		{ title },
		{ name: 'description', content: description },
		{ property: 'og:title', content: title },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:url', content: url },
		{ property: 'og:image', content: `https://teamcountdown.com/${ogImage}` },
		{ property: 'og:description', content: description },
		{ property: 'og:site_name', content: 'Team Countdown' },
		{ tagName: 'link', rel: 'canonical', href: url },
		{ 'script:ld+json': generateSportsOrganizationSchema(LEAGUE, url) },
		{ 'script:ld+json': generateBreadcrumbSchema(breadcrumbItems) },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'FAQPage',
				mainEntity: faqEntities,
			},
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				name: `${LEAGUE} Season Countdown`,
				description,
				url,
				about: { '@type': 'SportsOrganization', name: meta?.fullName },
			},
		},
		...(seasonStartDate
			? [
					{
						'script:ld+json': {
							'@context': 'https://schema.org',
							'@type': 'SportsEvent',
							name: `${seasonYear} ${meta?.fullName ?? LEAGUE} Season`,
							startDate: seasonStartDate,
							location: { '@type': 'Place', name: 'North America' },
							organizer: {
								'@type': 'SportsOrganization',
								name: meta?.fullName ?? LEAGUE,
							},
							url,
						},
					},
			  ]
			: []),
	]

	return metaTags
}

export async function loader({ params: { league } }: LoaderFunctionArgs) {
	const LEAGUE = league!.toUpperCase()

	if (!['NFL', 'NBA', 'MLB', 'NHL', 'WNBA', 'CPL', 'MLS'].includes(LEAGUE)) {
		throw new Response(null, { status: 404 })
	}

	const scheduleFile =
		LEAGUE === 'NBA'
			? 'data/nba_schedule.json'
			: LEAGUE === 'MLB'
			? 'data/mlb_schedule.json'
			: LEAGUE === 'NHL'
			? 'data/nhl_schedule.json'
			: LEAGUE === 'WNBA'
			? 'data/wnba_schedule.json'
			: LEAGUE === 'CPL'
			? 'data/cpl_schedule.json'
			: LEAGUE === 'MLS'
			? 'data/mls_schedule.json'
			: 'data/nfl_schedule.json'

	const scheduleRaw = await readFile(scheduleFile, 'utf-8')
	const scheduleParsed = JSON.parse(scheduleRaw)

	let teams: Team[] =
		LEAGUE === 'MLB'
			? mlbTeams.teams.map(mlbTeamToTeam)
			: LEAGUE === 'NBA'
			? uniqBy(
					(scheduleParsed as NbaScheduleApi).leagueSchedule.gameDates
						.flatMap((gd) => gd.games)
						.map((g) => g.homeTeam),
					'teamId'
			  )
					.filter((t) => t.teamId > 0)
					.map(nbaTeamToTeam)
			: LEAGUE === 'NHL'
			? uniqBy(
					(scheduleParsed as NhlScheduleApi).games.map((g) => g.homeTeam),
					'id'
			  ).map(nhlTeamToTeam)
			: LEAGUE === 'WNBA'
			? uniqBy(
					(scheduleParsed as WnbaScheduleApi).leagueSchedule.gameDates
						.flatMap((gd) => gd.games)
						.map((g) => g.homeTeam),
					'teamId'
			  )
					.filter((t) => t.teamId > 0)
					.map(wnbaTeamToTeam)
			: LEAGUE === 'CPL'
			? uniqBy(
					(scheduleParsed as CplScheduleApi).matches.flatMap((m) => [
						m.home,
						m.away,
					]),
					'teamId'
			  ).map(cplTeamToTeam)
			: LEAGUE === 'MLS'
			? uniqBy(
					(scheduleParsed as MlsScheduleApi).events.flatMap((e) =>
						e.competitions[0].competitors.map((c) => c.team)
					),
					'id'
			  ).map(mlsTeamToTeam)
			: uniqBy(
					(scheduleParsed as NflScheduleApi).games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)
	teams = orderBy(teams, 'fullName')

	const [upcomingGames, seasonResult] = await Promise.all([
		getSuggestedGames(LEAGUE, undefined, undefined, 5),
		getSeasonStartDate(LEAGUE),
	])

	const leagueMeta = LEAGUE_META[LEAGUE]
	const { date, isMidSeason } = seasonResult
	const now = new Date()
	const seasonStartYear = isMidSeason
		? leagueMeta.crossYear
			? now.getFullYear() - 1
			: now.getFullYear()
		: date.getFullYear()
	const seasonYear = formatSeasonYear(seasonStartYear, leagueMeta.crossYear)

	return json({
		LEAGUE,
		teams,
		upcomingGames,
		seasonStartDate: date.toISOString(),
		isMidSeason,
		seasonYear,
	})
}

export default function LeagueIndex() {
	const { LEAGUE, teams, upcomingGames, seasonStartDate, isMidSeason } =
		useLoaderData<typeof loader>()

	const league = LEAGUE.toLowerCase()
	const leagueMeta = LEAGUE_META[LEAGUE]
	const gameEvent = leagueMeta?.seasonTerm ?? 'kickoff'

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: LEAGUE },
	]

	const seasonGame = {
		id: 'season-start',
		time: seasonStartDate,
		homeTeam: null,
		awayTeam: null,
		startTimeTbd: false,
	}

	return (
		<>
			<div className="flex flex-col min-h-screen md:h-auto">
				{isMidSeason ? (
					// Mid-season: dark themed layout with copy + team picker
					<div className="font-sans text-white p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-12 min-h-[600px] grow pb-20">
						<Breadcrumb className="mb-4">
							<BreadcrumbList className="text-white/70">
								<BreadcrumbItem>
									<BreadcrumbLink href="/" className="hover:text-white">
										Team Countdown
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="text-white/50" />
								<BreadcrumbItem>
									<BreadcrumbPage className="text-white font-normal">
										{LEAGUE}
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
						<h1 className="text-3xl">{LEAGUE} Countdown</h1>
						<div className="flex flex-col gap-10">
							<div className="space-y-5">
								<div className="space-y-3">
									<h2 className="text-2xl">Get pumped for game day</h2>
									<p className="text-white/80">
										Pick your team. Add it to your home screen. Watch the days,
										hours, and minutes tick away until {gameEvent}.
									</p>
									<a
										href="#teams"
										onClick={(e) => {
											e.preventDefault()
											const prefersReducedMotion = window.matchMedia(
												'(prefers-reduced-motion: reduce)'
											).matches
											document.getElementById('teams')?.scrollIntoView({
												behavior: prefersReducedMotion ? 'auto' : 'smooth',
												block: 'start',
											})
										}}
										className="content-link inline-flex items-center gap-1"
									>
										Choose your team <span aria-hidden="true">↓</span>
									</a>
								</div>
							</div>
							<div>
								<div className="space-y-1 max-w-[400px] mx-auto">
									<img
										src={
											LEAGUE === 'NFL'
												? '/hero.png'
												: `/${LEAGUE.toLowerCase()}-hero.png`
										}
										alt={`Screenshot of ${
											LEAGUE === 'MLB'
												? 'Texas Rangers'
												: LEAGUE === 'NBA'
												? 'Boston Celtics'
												: LEAGUE === 'NHL'
												? 'Florida Panthers'
												: LEAGUE === 'WNBA'
												? 'Indiana Fever'
												: LEAGUE === 'CPL'
												? 'Cavalry FC'
												: LEAGUE === 'MLS'
												? 'Inter Miami CF'
												: 'Kansas City Chiefs'
										} countdown in action.`}
										className="rounded-sm"
									/>
									<p className="text-sm text-white/60">
										Screenshot of{' '}
										{LEAGUE === 'MLB'
											? 'Texas Rangers'
											: LEAGUE === 'NBA'
											? 'Boston Celtics'
											: LEAGUE === 'NHL'
											? 'Florida Panthers'
											: LEAGUE === 'WNBA'
											? 'Indiana Fever'
											: LEAGUE === 'CPL'
											? 'Cavalry FC'
											: LEAGUE === 'MLS'
											? 'Inter Miami CF'
											: 'Kansas City Chiefs'}{' '}
										countdown in action.
									</p>
								</div>
							</div>
							<div id="teams" className="space-y-3">
								<h3 className="text-xl">Choose your team:</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{teams.map((team) => (
										<a
											key={team.abbreviation}
											href={`/${league}/${team.abbreviation.toLowerCase()}`}
											className="flex items-center gap-4 py-2 content-link group"
										>
											<img
												src={`/logos/${
													LEAGUE === 'NFL' ? '' : `${league}/`
												}${team.abbreviation.toLowerCase()}.svg`}
												alt={`${team.fullName} logo`}
												className="h-10 w-10 object-contain flex-shrink-0"
											/>
											<div className="text-base font-semibold text-white">
												{team.fullName}
											</div>
										</a>
									))}
								</div>
							</div>
							<UpcomingGames games={upcomingGames} league={LEAGUE} />
						</div>
					</div>
				) : (
					// Offseason: dark themed countdown layout
					<Countdown
						pageTitle={`${LEAGUE} Season Countdown`}
						teams={teams}
						game={seasonGame}
						isTeamPage={false}
						breadcrumbItems={breadcrumbItems}
						teamPickerTeams={teams}
					/>
				)}
				<Footer league={LEAGUE} dark />
			</div>
		</>
	)
}
