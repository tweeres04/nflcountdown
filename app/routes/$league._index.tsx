import { json, type MetaFunction, LoaderFunctionArgs } from '@remix-run/node'
import { uniqBy, orderBy } from 'lodash-es'
import { useLoaderData } from '@remix-run/react'
import mlbTeams from '../../mlb_teams.json'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplTeamToTeam } from '~/lib/cplGameToGame'
import { mlsTeamToTeam } from '~/lib/mlsGameToGame'
import { readFile } from 'node:fs/promises'
import { NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, CplScheduleApi, MlsScheduleApi, Team } from '~/lib/types'
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const LEAGUE = data?.LEAGUE ?? 'NFL'
	const lowercaseLeague = LEAGUE.toLowerCase()

	const title = `When is the next ${LEAGUE} game? - Team Countdown`
	
	// League-specific endings for meta description
	const gameEvent = 
		LEAGUE === 'NBA' || LEAGUE === 'WNBA' ? 'tip-off' :
		LEAGUE === 'MLB' ? 'first pitch' :
		LEAGUE === 'NHL' ? 'puck drop' :
		'kickoff' // NFL, MLS, CPL
	
	const description = `Get pumped for your team's next ${LEAGUE} game. Add the countdown to your home screen and watch the clock tick until ${gameEvent}.`
	const ogImage = LEAGUE === 'NFL' ? 'og.png' : `${lowercaseLeague}-og.png`
	const url = `https://teamcountdown.com/${lowercaseLeague}`

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: LEAGUE }, // No href = current page
	]

	const metaTags: any[] = [
		{ title },
		{
			name: 'description',
			content: description,
		},
		{ name: 'og:title', content: title },
		{ name: 'og:type', content: 'website' },
		{
			name: 'og:url',
			content: url,
		},
		{
			name: 'og:image',
			content: `https://teamcountdown.com/${ogImage}`,
		},
		{
			name: 'og:description',
			content: description,
		},
		{ name: 'og:site_name', content: 'Team Countdown' },
		{
			tagName: 'link',
			rel: 'canonical',
			href: url,
		},
		{
			'script:ld+json': generateSportsOrganizationSchema(LEAGUE, url),
		},
		{
			'script:ld+json': generateBreadcrumbSchema(breadcrumbItems),
		},
	]

	return metaTags
}

export async function loader({ params: { league } }: LoaderFunctionArgs) {
	const LEAGUE = league!.toUpperCase()

	// Validate league
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
					(scheduleParsed as CplScheduleApi).matches.flatMap((m) => [m.home, m.away]),
					'teamId'
			  ).map(cplTeamToTeam)
			: LEAGUE === 'MLS'
			? uniqBy(
					(scheduleParsed as MlsScheduleApi).events.flatMap((e) => 
						e.competitions[0].competitors.map(c => c.team)
					),
					'id'
			  ).map(mlsTeamToTeam)
			: uniqBy(
					(scheduleParsed as NflScheduleApi).games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)
	teams = orderBy(teams, 'fullName')

	// Get upcoming games for the league
	const upcomingGames = await getSuggestedGames(LEAGUE, undefined, undefined, 5)

	return json({ LEAGUE, teams, upcomingGames })
}

export default function LeagueIndex() {
	const { LEAGUE, teams, upcomingGames } = useLoaderData<typeof loader>()
	
	// League-specific game event for body copy
	const gameEvent = 
		LEAGUE === 'NBA' || LEAGUE === 'WNBA' ? 'tip-off' :
		LEAGUE === 'MLB' ? 'first pitch' :
		LEAGUE === 'NHL' ? 'puck drop' :
		'kickoff' // NFL, MLS, CPL
	return (
		<>
			<div className="flex flex-col min-h-screen md:h-auto">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-12 min-h-[600px] grow pb-20">
					<Breadcrumb className="mb-4">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">Team Countdown</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{LEAGUE}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<h1 className="text-3xl">{LEAGUE} Countdown</h1>
					<div className="flex flex-col gap-10">
						<div className="space-y-5">
							<div className="space-y-3">
								<h2 className="text-2xl">
									Get pumped for game day
								</h2>
							<p>
								Pick your team. Add it to your home screen. Watch the days, hours, and minutes tick away until {gameEvent}.
							</p>
							<a 
								href="#teams" 
								onClick={(e) => {
									e.preventDefault()
									const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
									document.getElementById('teams')?.scrollIntoView({ 
										behavior: prefersReducedMotion ? 'auto' : 'smooth', 
										block: 'start' 
									})
								}}
								className="content-link stone inline-flex items-center gap-1"
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
								<p className="text-sm">
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
										href={`/${LEAGUE.toLowerCase()}/${team.abbreviation.toLowerCase()}`}
										className="flex items-center gap-4 py-2 content-link stone group"
									>
										<img
											src={`/logos/${
												LEAGUE === 'NFL'
													? ''
													: `${LEAGUE.toLowerCase()}/`
											}${team.abbreviation.toLowerCase()}.svg`}
											alt={`${team.fullName} logo`}
											className="h-10 w-10 object-contain flex-shrink-0"
										/>
										<div className="text-base font-semibold text-stone-900">
											{team.fullName}
										</div>
									</a>
								))}
							</div>
						</div>
						<UpcomingGames games={upcomingGames} league={LEAGUE} />
					</div>
				</div>
				<Footer league={LEAGUE} />
			</div>
		</>
	)
}
