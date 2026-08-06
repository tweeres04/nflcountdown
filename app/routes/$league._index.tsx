import { json, type MetaFunction, LoaderFunctionArgs } from '@remix-run/node'
import { uniqBy, orderBy } from 'lodash-es'
import { useLoaderData } from '@remix-run/react'
import { RouteErrorBoundary } from '~/components/route-error-boundary'
import mlbTeams from '../../mlb_teams.json'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplTeamToTeam } from '~/lib/cplGameToGame'
import { cflTeamToTeam } from '~/lib/cflGameToGame'
import { nslTeamToTeam } from '~/lib/nslGameToGame'
import { ceblTeamToTeam } from '~/lib/ceblGameToGame'
import { mlsTeamToTeam } from '~/lib/mlsGameToGame'
import { nwslTeamToTeam } from '~/lib/nwslGameToGame'
import { pwhlTeamToTeam } from '~/lib/pwhlGameToGame'
import { cfbTeamToTeam } from '~/lib/cfbGameToGame'
import { worldCupTeamToTeam } from '~/lib/worldCupGameToGame'
import { wwcTeamToTeam } from '~/lib/wwcGameToGame'
import { readFile } from 'node:fs/promises'
import {
	NbaScheduleApi,
	NflScheduleApi,
	NhlScheduleApi,
	WnbaScheduleApi,
	CplScheduleApi,
	CflScheduleApi,
	NslScheduleApi,
	CeblScheduleApi,
	MlsScheduleApi,
	NwslScheduleApi,
	PwhlScheduleApi,
	CfbScheduleApi,
	WorldCupScheduleApi,
	WwcScheduleApi,
	WwcTeamApi,
	Team,
} from '~/lib/types'
import {
	generateSportsOrganizationSchema,
	generateBreadcrumbSchema,
	generateLeagueSportsEventSchema,
	getLeagueDisplayName,
	TOURNAMENT_LEAGUES,
} from '~/lib/schema-helpers'
import Footer from '~/components/footer'
import { getSuggestedGames } from '~/lib/getSuggestedGames'
import Countdown from '~/components/countdown'
import { getSeasonStartDate } from '~/lib/getSeasonStartDate'
import { getAllTeamsByLeague } from '~/lib/getTeams'

interface LeagueMeta {
	fullName: string
	shortName: string
	seasonTerm: string // e.g. "kickoff", "opening day", "puck drop", "tip-off"
	titleKeyword: string // e.g. "NFL Kickoff", "MLB Opening Day"
	crossYear: boolean // true for leagues whose season spans two calendar years (NBA, NHL)
	teamCount: number // for static FAQ entries
	seasonLength: string // e.g. "18 weeks", "162 games per team"
	seasonMonths: string // e.g. "September to February", "October to June"
	brandColor: string // league primary brand color (hex)
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
		brandColor: '#013369',
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
		brandColor: '#002D72',
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
		brandColor: '#1D428A',
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
		brandColor: '#000000',
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
		brandColor: '#FF6A00',
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
		brandColor: '#292929',
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
		brandColor: '#6D2077',
	},
	CFL: {
		fullName: 'Canadian Football League',
		shortName: 'CFL',
		seasonTerm: 'kickoff',
		titleKeyword: 'CFL Season',
		crossYear: false,
		teamCount: 9,
		seasonLength: '18 games per team',
		seasonMonths: 'June to November',
		brandColor: '#C42127',
	},
	NSL: {
		fullName: 'Northern Super League',
		shortName: 'NSL',
		seasonTerm: 'kickoff',
		titleKeyword: 'NSL Season',
		crossYear: false,
		teamCount: 6,
		seasonLength: '25 games per team',
		seasonMonths: 'April to November',
		brandColor: '#00654A',
	},
	CEBL: {
		fullName: 'Canadian Elite Basketball League',
		shortName: 'CEBL',
		seasonTerm: 'tip-off',
		titleKeyword: 'CEBL Season',
		crossYear: false,
		teamCount: 10,
		seasonLength: '24 games per team',
		seasonMonths: 'May to August',
		brandColor: '#1A1A1A',
	},
	NWSL: {
		fullName: "National Women's Soccer League",
		shortName: 'NWSL',
		seasonTerm: 'kickoff',
		titleKeyword: 'NWSL Season',
		crossYear: false,
		teamCount: 16,
		seasonLength: '30 games per team',
		seasonMonths: 'March to November',
		brandColor: '#003087',
	},
	PWHL: {
		fullName: "Professional Women's Hockey League",
		shortName: 'PWHL',
		seasonTerm: 'puck drop',
		titleKeyword: 'PWHL Season',
		crossYear: true,
		teamCount: 8,
		seasonLength: '30 games per team',
		seasonMonths: 'January to April',
		brandColor: '#350282',
	},
	CFB: {
		fullName: 'College Football',
		shortName: 'CFB',
		seasonTerm: 'kickoff',
		titleKeyword: 'College Football Season',
		crossYear: false,
		teamCount: 68,
		seasonLength: '12-15 games per team',
		seasonMonths: 'August to January',
		brandColor: '#1a1a1a',
	},
	WORLDCUP: {
		fullName: 'FIFA World Cup',
		shortName: 'World Cup',
		seasonTerm: 'kickoff',
		titleKeyword: 'World Cup',
		crossYear: false,
		teamCount: 48,
		seasonLength: '104 matches',
		seasonMonths: 'June to July',
		brandColor: '#326295', // FIFA corporate blue
	},
	WWC: {
		fullName: "FIFA Women's World Cup",
		shortName: "Women's World Cup",
		seasonTerm: 'kickoff',
		titleKeyword: "Women's World Cup",
		crossYear: false,
		teamCount: 32,
		seasonLength: '64 matches',
		seasonMonths: 'June to July',
		brandColor: '#006341', // dark green from the Brasil 2027 palette
	},
}

function formatSeasonYear(year: number, crossYear: boolean): string {
	if (crossYear) {
		return `${year}-${String(year + 1).slice(2)}`
	}
	return String(year)
}

// Single source for the league FAQ so the visible section and the FAQPage
// JSON-LD stay identical — Google requires marked-up FAQ content to be
// visible on the page.
function buildLeagueFaqs(
	LEAGUE: string,
	seasonYear: string,
	isMidSeason: boolean,
	seasonStartDate: string | undefined
): { question: string; answer: string }[] {
	const leagueLabel = getLeagueDisplayName(LEAGUE)
	const meta = LEAGUE_META[LEAGUE]
	const isTournament = TOURNAMENT_LEAGUES.has(LEAGUE)
	const eventNoun = isTournament ? leagueLabel : `${leagueLabel} season`

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

	// Next season year for mid-season references (World Cups are quadrennial)
	const nextSeasonStartYear = isMidSeason
		? isTournament
			? new Date().getFullYear() + 4
			: meta?.crossYear
			? new Date().getFullYear()
			: new Date().getFullYear() + 1
		: null
	const nextSeasonYear = nextSeasonStartYear
		? formatSeasonYear(nextSeasonStartYear, meta?.crossYear ?? false)
		: null

	return [
		// Q1+Q2: same questions, conditional answers
		{
			question: `How many days until the ${eventNoun} starts?`,
			answer: isMidSeason
				? `The ${seasonYear} ${eventNoun} has already started. The next ${
						isTournament ? leagueLabel : 'season'
				  } is expected to begin in ${
						meta?.seasonMonths?.split(' to ')[0] ?? 'fall'
				  } ${nextSeasonYear}. Pick your team above to count down to their next game.`
				: `The ${seasonYear} ${eventNoun} starts on ${seasonStartFormattedShort}. Use the live countdown above for the exact days, hours, minutes, and seconds remaining.`,
		},
		{
			question: `When does the ${eventNoun} start?`,
			answer: isMidSeason
				? `The current ${eventNoun} began in ${
						meta?.seasonMonths?.split(' to ')[0] ?? 'fall'
				  } ${seasonYear}. The next ${eventNoun} is expected to start in ${
						meta?.seasonMonths?.split(' to ')[0] ?? 'fall'
				  } ${nextSeasonYear}.`
				: `${leagueLabel} ${
						meta?.seasonTerm ?? 'kickoff'
				  } is on ${seasonStartFormatted}.`,
		},
		// Q3+Q4: static evergreen entries
		{
			question: `How many teams are in the ${leagueLabel}?`,
			answer: `The ${meta?.fullName ?? leagueLabel} has ${
				meta?.teamCount ?? ''
			} teams.`,
		},
		{
			question: `How long is the ${eventNoun}?`,
			answer: isTournament
				? `The ${leagueLabel} runs ${
						meta?.seasonLength ?? ''
				  }, typically from ${meta?.seasonMonths ?? ''}.`
				: `The ${leagueLabel} regular season runs ${
						meta?.seasonLength ?? ''
				  }, typically from ${meta?.seasonMonths ?? ''}.`,
		},
	]
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const LEAGUE = data?.LEAGUE ?? 'NFL'
	const leagueLabel = getLeagueDisplayName(LEAGUE)
	const lowercaseLeague = LEAGUE.toLowerCase()
	const meta = LEAGUE_META[LEAGUE]
	const isMidSeason = data?.isMidSeason ?? false
	const seasonYear = data?.seasonYear ?? String(new Date().getFullYear())
	const seasonStartDate = data?.seasonStartDate
	const url = `https://teamcountdown.com/${lowercaseLeague}`
	const ogImage = LEAGUE === 'NFL' ? 'og.png' : `${lowercaseLeague}-og.png`

	const isTournament = TOURNAMENT_LEAGUES.has(LEAGUE)
	const eventNoun = isTournament ? leagueLabel : `${leagueLabel} season`

	const title = `${leagueLabel} Game Countdown - Team Countdown ${seasonYear}`

	const description = isMidSeason
		? `The ${seasonYear} ${eventNoun} is underway. Live countdown to the next game. Pick your team for a personalized countdown.`
		: `Countdown to the first ${leagueLabel} game of ${seasonYear}. Pick your team and add the countdown to your home screen.`

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: leagueLabel },
	]

	const faqEntities = buildLeagueFaqs(
		LEAGUE,
		seasonYear,
		isMidSeason,
		seasonStartDate
	).map((faq) => ({
		'@type': 'Question',
		name: faq.question,
		acceptedAnswer: { '@type': 'Answer', text: faq.answer },
	}))

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
				name: isTournament
					? `${leagueLabel} Countdown`
					: `${leagueLabel} Season Countdown`,
				description,
				url,
				about: { '@type': 'SportsOrganization', name: meta?.fullName },
			},
		},
		...(seasonStartDate
			? [
					{
						'script:ld+json': generateLeagueSportsEventSchema(
							LEAGUE,
							seasonYear,
							seasonStartDate,
							url
						),
					},
			  ]
			: []),
	]

	return metaTags
}

export async function loader({ params: { league } }: LoaderFunctionArgs) {
	const LEAGUE = league!.toUpperCase()

	if (
		![
			'NFL',
			'NBA',
			'MLB',
			'NHL',
			'WNBA',
			'CPL',
			'CFL',
			'NSL',
			'CEBL',
			'MLS',
			'NWSL',
			'PWHL',
			'CFB',
			'WORLDCUP',
			'WWC',
		].includes(LEAGUE)
	) {
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
			: LEAGUE === 'CFL'
			? 'data/cfl_schedule.json'
			: LEAGUE === 'NSL'
			? 'data/nsl_schedule.json'
			: LEAGUE === 'CEBL'
			? 'data/cebl_schedule.json'
			: LEAGUE === 'MLS'
			? 'data/mls_schedule.json'
			: LEAGUE === 'NWSL'
			? 'data/nwsl_schedule.json'
			: LEAGUE === 'PWHL'
			? 'data/pwhl_schedule.json'
			: LEAGUE === 'CFB'
			? 'data/cfb_schedule.json'
			: LEAGUE === 'WORLDCUP'
			? 'data/worldcup_schedule.json'
			: LEAGUE === 'WWC'
			? 'data/wwc_schedule.json'
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
			: LEAGUE === 'CFL'
			? uniqBy(
					(scheduleParsed as CflScheduleApi).rounds
						.flatMap((r) => r.tournaments)
						.map((g) => g.homeSquad),
					'id'
			  ).map(cflTeamToTeam)
			: LEAGUE === 'NSL'
			? uniqBy(
					(scheduleParsed as NslScheduleApi).events.flatMap((e) =>
						e.competitions[0].competitors.map((c) => c.team)
					),
					'id'
			  ).map(nslTeamToTeam)
			: LEAGUE === 'CEBL'
			? uniqBy(
					(scheduleParsed as CeblScheduleApi).games,
					'home_team_id'
			  ).map((g) => ceblTeamToTeam(g.home_team_id, g.home_team_name))
			: LEAGUE === 'MLS'
			? uniqBy(
					(scheduleParsed as MlsScheduleApi).events.flatMap((e) =>
						e.competitions[0].competitors.map((c) => c.team)
					),
					'id'
			  ).map(mlsTeamToTeam)
			: LEAGUE === 'NWSL'
			? uniqBy(
					(scheduleParsed as NwslScheduleApi).events.flatMap((e) =>
						e.competitions[0].competitors.map((c) => c.team)
					),
					'id'
			  ).map(nwslTeamToTeam)
			: LEAGUE === 'PWHL'
			? uniqBy(
					(scheduleParsed as PwhlScheduleApi).SiteKit.Scorebar,
					'HomeID'
			  ).map((g) =>
					pwhlTeamToTeam(
						g.HomeID,
						g.HomeCode,
						g.HomeCity,
						g.HomeNickname,
						g.HomeLongName
					)
			  )
			: LEAGUE === 'CFB'
			? uniqBy(
					(scheduleParsed as CfbScheduleApi).events.flatMap((e) =>
						e.competitions[0].competitors.map((c) => c.team)
					),
					'id'
			  ).map(cfbTeamToTeam)
			: LEAGUE === 'WORLDCUP'
			? (uniqBy(
					(scheduleParsed as WorldCupScheduleApi).Results.flatMap((m) => [
						m.Home,
						m.Away,
					]).filter(
						(t): t is NonNullable<typeof t> => t !== null && !!t.IdTeam
					),
					'IdTeam'
			  )
					.map(worldCupTeamToTeam)
					.filter((t): t is Team => t !== null) as Team[])
			: LEAGUE === 'WWC'
			? (uniqBy(
					(scheduleParsed as WwcScheduleApi).Results.flatMap((m) => [
						m.Home,
						m.Away,
					]).filter((t): t is WwcTeamApi => t !== null && !!t.IdTeam),
					'IdTeam'
			  )
					.map(wwcTeamToTeam)
					.filter((t): t is Team => t !== null) as Team[])
			: uniqBy(
					(scheduleParsed as NflScheduleApi).games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)
	teams = orderBy(teams, 'fullName')

	const [upcomingGames, seasonResult, allTeams] = await Promise.all([
		getSuggestedGames(LEAGUE, undefined, undefined, 5),
		getSeasonStartDate(LEAGUE),
		getAllTeamsByLeague(),
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
		allTeams,
		upcomingGames,
		seasonStartDate: date.toISOString(),
		isMidSeason,
		seasonYear,
	})
}

export function ErrorBoundary() {
	return (
		<RouteErrorBoundary
			notFoundTitle="League not found"
			notFoundMessage="We don't have a countdown for that league yet."
		/>
	)
}

export default function LeagueIndex() {
	const {
		LEAGUE,
		teams,
		allTeams,
		upcomingGames,
		seasonStartDate,
		isMidSeason,
		seasonYear,
	} = useLoaderData<typeof loader>()

	const leagueMeta = LEAGUE_META[LEAGUE]
	const leagueLabel = getLeagueDisplayName(LEAGUE)

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: leagueLabel },
	]

	const seasonGame = {
		id: 'season-start',
		time: seasonStartDate,
		homeTeam: null,
		awayTeam: null,
		startTimeTbd: false,
	}

	// Next game is either the soonest upcoming game or the season opener
	const nextGame = upcomingGames[0] ?? seasonGame

	const faqs = buildLeagueFaqs(LEAGUE, seasonYear, isMidSeason, seasonStartDate)

	return (
		<>
			<div className="flex flex-col min-h-screen md:h-auto">
				<Countdown
					pageTitle={`${leagueLabel} Countdown`}
					teams={teams}
					allTeams={allTeams}
					game={nextGame}
					isTeamPage={false}
					breadcrumbItems={breadcrumbItems}
					teamPickerTeams={teams}
					suggestedGames={upcomingGames.slice(1)}
					leagueBrandColor={leagueMeta?.brandColor}
					searchLocation="league"
					faqs={faqs}
				/>
				<Footer league={LEAGUE} dark />
			</div>
		</>
	)
}
