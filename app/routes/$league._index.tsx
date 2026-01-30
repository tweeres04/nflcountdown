import { json, type MetaFunction, LoaderFunctionArgs } from '@remix-run/node'
import { uniqBy, orderBy } from 'lodash-es'
import TeamsDropdown from '~/components/ui/teams-dropdown'
import { useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import mlbTeams from '../../mlb_teams.json'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { readFile } from 'node:fs/promises'
import { NbaScheduleApi, NflScheduleApi, Team } from '~/lib/types'
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const LEAGUE = data?.LEAGUE ?? 'NFL'
	const lowercaseLeague = LEAGUE.toLowerCase()

	const title = `When is the next ${LEAGUE} game? - Team Countdown`
	const description = `The fastest and prettiest way to check the next ${LEAGUE} game. Launches instantly from your home screen.`
	const ogImage = LEAGUE === 'NFL' ? 'og.png' : `${lowercaseLeague}-og.png`
	const url = `https://teamcountdown.com/${lowercaseLeague}`

	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
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
	if (!['NFL', 'NBA', 'MLB'].includes(LEAGUE)) {
		throw new Response(null, { status: 404 })
	}

	const scheduleFile =
		LEAGUE === 'NBA'
			? 'data/nba_schedule.json'
			: LEAGUE === 'MLB'
			? 'data/mlb_schedule.json'
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
			: uniqBy(
					(scheduleParsed as NflScheduleApi).games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)
	teams = orderBy(teams, 'fullName')

	return json({ LEAGUE, teams })
}

export default function LeagueIndex() {
	const { LEAGUE, teams } = useLoaderData<typeof loader>()
	return (
		<>
			<div className="flex flex-col min-h-screen md:h-auto">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-12 min-h-[600px] grow pb-20">
					<Breadcrumb className="mb-4">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">Home</BreadcrumbLink>
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
									Get pumped for your team's next game!
								</h2>
								<p>
									A fast, pretty web app that counts down to the next {LEAGUE}{' '}
									game. Saves to your home screen for immediate access.
								</p>
							</div>
							<TeamsDropdown teams={teams}>
								<Button className="border-stone-900">Pick your team</Button>
							</TeamsDropdown>
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
										: 'Kansas City Chiefs'}{' '}
									countdown in action.
								</p>
							</div>
						</div>
					</div>
				</div>
				<Footer league={LEAGUE} />
			</div>
		</>
	)
}
