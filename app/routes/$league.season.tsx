import { json, redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import Countdown from '~/components/countdown'
import { getSeasonStartDate } from '~/lib/getSeasonStartDate'
import { generateBreadcrumbSchema } from '~/lib/schema-helpers'
import { uniqBy, orderBy } from 'lodash-es'
import { readFile } from 'node:fs/promises'
import mlbTeams from '../../mlb_teams.json'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplTeamToTeam } from '~/lib/cplGameToGame'
import { mlsTeamToTeam } from '~/lib/mlsGameToGame'
import type {
	NbaScheduleApi,
	NflScheduleApi,
	NhlScheduleApi,
	WnbaScheduleApi,
	CplScheduleApi,
	MlsScheduleApi,
	Team,
} from '~/lib/types'

const SUPPORTED_LEAGUES = ['NFL', 'MLB', 'NBA', 'NHL', 'WNBA', 'CPL', 'MLS']

interface LeagueMeta {
	fullName: string // e.g. "National Football League"
	shortName: string // e.g. "NFL"
	seasonTerm: string // e.g. "kickoff", "opening day", "puck drop", "tip-off"
	titleKeyword: string // e.g. "NFL Kickoff", "MLB Opening Day"
	crossYear: boolean // true for leagues whose season spans two calendar years (NBA, NHL)
}

const LEAGUE_META: Record<string, LeagueMeta> = {
	NFL: {
		fullName: 'National Football League',
		shortName: 'NFL',
		seasonTerm: 'kickoff',
		titleKeyword: 'NFL Kickoff',
		crossYear: false, // Branded as "2026 NFL Season" even though it runs Sep-Feb
	},
	MLB: {
		fullName: 'Major League Baseball',
		shortName: 'MLB',
		seasonTerm: 'opening day',
		titleKeyword: 'MLB Opening Day',
		crossYear: false,
	},
	NBA: {
		fullName: 'National Basketball Association',
		shortName: 'NBA',
		seasonTerm: 'tip-off',
		titleKeyword: 'NBA Season',
		crossYear: true, // "2025-26 NBA Season"
	},
	NHL: {
		fullName: 'National Hockey League',
		shortName: 'NHL',
		seasonTerm: 'puck drop',
		titleKeyword: 'NHL Season',
		crossYear: true, // "2025-26 NHL Season"
	},
	WNBA: {
		fullName: "Women's National Basketball Association",
		shortName: 'WNBA',
		seasonTerm: 'tip-off',
		titleKeyword: 'WNBA Season',
		crossYear: false,
	},
	MLS: {
		fullName: 'Major League Soccer',
		shortName: 'MLS',
		seasonTerm: 'kickoff',
		titleKeyword: 'MLS Season',
		crossYear: false,
	},
	CPL: {
		fullName: 'Canadian Premier League',
		shortName: 'CPL',
		seasonTerm: 'kickoff',
		titleKeyword: 'CPL Season',
		crossYear: false,
	},
}

/**
 * Formats a season year label based on whether the league spans two calendar years.
 * e.g. NBA/NHL: "2025-26", NFL/MLB/etc: "2026"
 */
function formatSeasonYear(year: number, crossYear: boolean): string {
	if (crossYear) {
		return `${year}-${String(year + 1).slice(2)}`
	}
	return String(year)
}

async function getTeamsForLeague(LEAGUE: string): Promise<Team[]> {
	if (LEAGUE === 'MLB') {
		return orderBy(mlbTeams.teams.map(mlbTeamToTeam), 'fullName')
	}
	if (LEAGUE === 'NBA') {
		const raw = await readFile('data/nba_schedule.json', 'utf-8')
		const schedule: NbaScheduleApi = JSON.parse(raw)
		return orderBy(
			uniqBy(
				schedule.leagueSchedule.gameDates
					.flatMap((gd) => gd.games)
					.map((g) => g.homeTeam),
				'teamId'
			)
				.filter((t) => t.teamId > 0)
				.map(nbaTeamToTeam),
			'fullName'
		)
	}
	if (LEAGUE === 'NFL') {
		const raw = await readFile('data/nfl_schedule.json', 'utf-8')
		const schedule: NflScheduleApi = JSON.parse(raw)
		return orderBy(
			uniqBy(
				schedule.games.map((g) => g.homeTeam),
				'id'
			).map(nflTeamToTeam),
			'fullName'
		)
	}
	if (LEAGUE === 'NHL') {
		const raw = await readFile('data/nhl_schedule.json', 'utf-8')
		const schedule: NhlScheduleApi = JSON.parse(raw)
		return orderBy(
			uniqBy(
				schedule.games.map((g) => g.homeTeam),
				'id'
			).map(nhlTeamToTeam),
			'fullName'
		)
	}
	if (LEAGUE === 'WNBA') {
		const raw = await readFile('data/wnba_schedule.json', 'utf-8')
		const schedule: WnbaScheduleApi = JSON.parse(raw)
		return orderBy(
			uniqBy(
				schedule.leagueSchedule.gameDates
					.flatMap((gd) => gd.games)
					.map((g) => g.homeTeam),
				'teamId'
			)
				.filter((t) => t.teamId > 0)
				.map(wnbaTeamToTeam),
			'fullName'
		)
	}
	if (LEAGUE === 'CPL') {
		const raw = await readFile('data/cpl_schedule.json', 'utf-8')
		const schedule: CplScheduleApi = JSON.parse(raw)
		return orderBy(
			uniqBy(
				schedule.matches.flatMap((m) => [m.home, m.away]),
				'teamId'
			).map(cplTeamToTeam),
			'fullName'
		)
	}
	if (LEAGUE === 'MLS') {
		const raw = await readFile('data/mls_schedule.json', 'utf-8')
		const schedule: MlsScheduleApi = JSON.parse(raw)
		return orderBy(
			uniqBy(
				schedule.events.flatMap((e) =>
					e.competitions[0].competitors.map((c) => c.team)
				),
				'id'
			).map(mlsTeamToTeam),
			'fullName'
		)
	}
	return []
}

export async function loader({ params, request }: LoaderFunctionArgs) {
	const LEAGUE = params.league?.toUpperCase() ?? ''

	if (!SUPPORTED_LEAGUES.includes(LEAGUE)) {
		throw new Response(null, { status: 404 })
	}

	// Redirect trailing slash: /nfl/season/ → /nfl/season
	const url = new URL(request.url)
	if (url.pathname.endsWith('/')) {
		return redirect(url.pathname.slice(0, -1), { status: 301 })
	}

	const [teams, seasonResult] = await Promise.all([
		getTeamsForLeague(LEAGUE),
		getSeasonStartDate(LEAGUE),
	])

	const meta = LEAGUE_META[LEAGUE]
	const league = params.league!.toLowerCase()
	const { date, isMidSeason } = seasonResult

	const now = new Date()
	const seasonStartYear = isMidSeason
		? meta.crossYear
			? now.getFullYear() - 1 // e.g. mid-season NHL in Feb 2026 → "2025-26"
			: now.getFullYear()     // e.g. mid-season MLS in Feb 2026 → "2026"
		: date.getFullYear()
	const seasonYear = formatSeasonYear(seasonStartYear, meta.crossYear)

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: meta.shortName, href: `/${league}` },
		{ label: 'Season Countdown' },
	]

	return json({
		LEAGUE,
		league,
		teams,
		seasonStartDate: date.toISOString(),
		isMidSeason,
		seasonYear,
		breadcrumbItems,
		meta,
	})
}

export function meta({
	data,
}: {
	data: ReturnType<typeof useLoaderData<typeof loader>> | null
}) {
	if (!data) return [{ title: 'Season Countdown | Team Countdown' }]

	const { league, meta, seasonStartDate, isMidSeason, seasonYear } = data
	const url = `https://teamcountdown.com/${league}/season`

	const title = isMidSeason
		? `${meta.shortName} Season Countdown | Team Countdown`
		: `How Many Days Till ${meta.titleKeyword}? Live ${meta.shortName} Season Countdown`

	const description = isMidSeason
		? `The ${seasonYear} ${meta.shortName} season is underway. Pick your team and count down to their next game.`
		: `Find out exactly how many days until ${meta.shortName} season starts. Live countdown showing the precise days, hours, and minutes until ${meta.fullName} ${meta.seasonTerm} in ${seasonYear}.`

	const seasonStartFormatted = new Date(seasonStartDate).toLocaleDateString(
		'en-US',
		{ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
	)
	const seasonStartFormattedShort = new Date(seasonStartDate).toLocaleDateString(
		'en-US',
		{ month: 'long', day: 'numeric', year: 'numeric' }
	)

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: meta.shortName, href: `/${league}` },
		{ label: 'Season Countdown' },
	]

	const faqEntities = isMidSeason
		? [
				{
					'@type': 'Question',
					name: `When did the ${meta.shortName} season start?`,
					acceptedAnswer: {
						'@type': 'Answer',
						text: `The ${seasonYear} ${meta.shortName} season is already underway. Pick your team above to count down to their next game.`,
					},
				},
				{
					'@type': 'Question',
					name: `Is the ${meta.shortName} season happening right now?`,
					acceptedAnswer: {
						'@type': 'Answer',
						text: `Yes, the ${seasonYear} ${meta.shortName} season is currently in progress. Select your team to get a live countdown to their next game.`,
					},
				},
			]
		: [
				{
					'@type': 'Question',
					name: `How many days until ${meta.shortName} season starts?`,
					acceptedAnswer: {
						'@type': 'Answer',
						text: `The ${seasonYear} ${meta.shortName} season starts on ${seasonStartFormattedShort}. Use the live countdown above for the exact days, hours, minutes, and seconds remaining.`,
					},
				},
				{
					'@type': 'Question',
					name: `When does the ${meta.shortName} season start in ${seasonYear}?`,
					acceptedAnswer: {
						'@type': 'Answer',
						text: `${meta.shortName} ${meta.seasonTerm} is on ${seasonStartFormatted}.`,
					},
				},
			]

	return [
		{ title },
		{ name: 'description', content: description },
		{ property: 'og:title', content: title },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:url', content: url },
		{ property: 'og:image', content: 'https://teamcountdown.com/og.png' },
		{ property: 'og:description', content: description },
		{ property: 'og:site_name', content: 'Team Countdown' },
		{ tagName: 'link', rel: 'canonical', href: url },
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
				name: `${meta.shortName} Season Countdown`,
				description,
				url,
				about: {
					'@type': 'SportsOrganization',
					name: meta.fullName,
				},
			},
		},
		...(!isMidSeason
			? [
					{
						'script:ld+json': {
							'@context': 'https://schema.org',
							'@type': 'SportsEvent',
							name: `${seasonYear} ${meta.fullName} Season`,
							startDate: seasonStartDate,
							location: {
								'@type': 'Place',
								name: 'North America',
							},
							organizer: {
								'@type': 'SportsOrganization',
								name: meta.fullName,
							},
							url,
						},
					},
				]
			: []),
		{
			'script:ld+json': generateBreadcrumbSchema(breadcrumbItems),
		},
	]
}

export default function SeasonCountdown() {
	const { LEAGUE, league, meta, teams, seasonStartDate, isMidSeason, seasonYear, breadcrumbItems } =
		useLoaderData<typeof loader>()

	if (isMidSeason) {
		const leagueLogo = `/logos/${league}.svg`
		return (
			<div className="font-sans text-white p-4 max-w-[500px] lg:max-w-[750px] mx-auto pb-32">
				<nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/70">
					<ol className="flex items-center gap-2">
						<li>
							<Link to="/" className="hover:text-white transition-colors">
								Team Countdown
							</Link>
						</li>
						<li aria-hidden>›</li>
						<li>
							<Link
								to={`/${league}`}
								className="hover:text-white transition-colors"
							>
								{meta.shortName}
							</Link>
						</li>
						<li aria-hidden>›</li>
						<li className="text-white">Season Countdown</li>
					</ol>
				</nav>

				<h1 className="text-2xl">{meta.shortName} Season Countdown</h1>

				<img
					src={leagueLogo}
					className={
						LEAGUE === 'NHL' || LEAGUE === 'CPL' || LEAGUE === 'MLS'
							? 'h-[256px] md:h-[384px] my-8 mx-auto'
							: 'w-[256px] h-[256px] md:w-[384px] md:h-[384px] mx-auto'
					}
					alt={`${meta.shortName} logo`}
				/>

				<div className="text-center text-3xl">
					The {seasonYear} {meta.shortName} season is underway!
				</div>

				<div className="mt-10 space-y-3">
					<h2 className="text-xl">Pick your team. Get your countdown.</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{teams.map((t) => (
							<Link
								key={t.abbreviation}
								to={`/${league}/${t.abbreviation.toLowerCase()}`}
								className="flex items-center gap-4 py-2 content-link group"
							>
								<img
									src={`/logos/${
										LEAGUE === 'NFL' ? '' : `${league}/`
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
			</div>
		)
	}

	const seasonGame = {
		id: 'season-start',
		time: seasonStartDate,
		homeTeam: null,
		awayTeam: null,
		startTimeTbd: false,
	}

	return (
		<Countdown
			pageTitle={`${meta.shortName} Season Countdown`}
			teams={teams}
			game={seasonGame}
			isTeamPage={false}
			breadcrumbItems={breadcrumbItems}
			teamPickerTeams={teams}
		/>
	)
}
