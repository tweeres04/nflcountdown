import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { RouteErrorBoundary } from '~/components/route-error-boundary'
import Countdown from '~/components/countdown'
import Footer from '~/components/footer'
import { getSeasonStartDate } from '~/lib/getSeasonStartDate'
import { generateBreadcrumbSchema } from '~/lib/schema-helpers'
import { getTeams } from '~/lib/getTeams'

const SUPPORTED_LEAGUES = [
	'NFL',
	'NBA',
	'MLB',
	'NHL',
	'WNBA',
	'CPL',
	'MLS',
	'NWSL',
	'PWHL',
	'CFB',
]

const LEAGUE_SEASON_META: Record<
	string,
	{ fullName: string; seasonTerm: string; titleKeyword: string; brandColor: string }
> = {
	NFL: { fullName: 'National Football League', seasonTerm: 'kickoff', titleKeyword: 'NFL Kickoff', brandColor: '#013369' },
	MLB: { fullName: 'Major League Baseball', seasonTerm: 'opening day', titleKeyword: 'MLB Opening Day', brandColor: '#002D72' },
	NBA: { fullName: 'National Basketball Association', seasonTerm: 'tip-off', titleKeyword: 'NBA Season', brandColor: '#1D428A' },
	NHL: { fullName: 'National Hockey League', seasonTerm: 'puck drop', titleKeyword: 'NHL Season', brandColor: '#000000' },
	WNBA: { fullName: "Women's National Basketball Association", seasonTerm: 'tip-off', titleKeyword: 'WNBA Season', brandColor: '#FF6A00' },
	MLS: { fullName: 'Major League Soccer', seasonTerm: 'kickoff', titleKeyword: 'MLS Season', brandColor: '#292929' },
	CPL: { fullName: 'Canadian Premier League', seasonTerm: 'kickoff', titleKeyword: 'CPL Season', brandColor: '#6D2077' },
	NWSL: { fullName: "National Women's Soccer League", seasonTerm: 'kickoff', titleKeyword: 'NWSL Season', brandColor: '#003087' },
	PWHL: { fullName: "Professional Women's Hockey League", seasonTerm: 'puck drop', titleKeyword: 'PWHL Season', brandColor: '#350282' },
	CFB: { fullName: 'College Football', seasonTerm: 'kickoff', titleKeyword: 'College Football Season', brandColor: '#1a1a1a' },
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) return []
	const { LEAGUE, seasonYear, seasonStartDate, isMidSeason } = data
	const meta = LEAGUE_SEASON_META[LEAGUE]
	const url = `https://teamcountdown.com/${LEAGUE.toLowerCase()}/season`

	const title = `How Many Days Till ${
		meta?.titleKeyword ?? LEAGUE + ' Season'
	} ${seasonYear}? - Team Countdown`

	const description = isMidSeason
		? `The ${seasonYear} ${LEAGUE} season is underway. Find out when the next season starts and count down to ${
				meta?.fullName ?? LEAGUE
		  } ${meta?.seasonTerm ?? 'kickoff'}.`
		: `Find out exactly how many days until ${LEAGUE} season starts. Live countdown to ${
				meta?.fullName ?? LEAGUE
		  } ${meta?.seasonTerm ?? 'kickoff'} in ${seasonYear}.`

	const seasonStartFormatted = seasonStartDate
		? new Date(seasonStartDate).toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
		  })
		: ''

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: LEAGUE, href: `/${LEAGUE.toLowerCase()}` },
		{ label: 'Season Countdown' },
	]

	const faqEntities = [
		{
			'@type': 'Question',
			name: `How many days until ${LEAGUE} season ${seasonYear}?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: isMidSeason
					? `The ${seasonYear} ${LEAGUE} season has already started. Use the countdown above to see when the next season begins.`
					: `Use the live countdown above for the exact days, hours, minutes, and seconds until ${LEAGUE} ${
							meta?.seasonTerm ?? 'kickoff'
					  } in ${seasonYear}.`,
			},
		},
		{
			'@type': 'Question',
			name: `When does the ${LEAGUE} season start?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: isMidSeason
					? `The ${seasonYear} ${LEAGUE} season is currently underway.`
					: `The ${seasonYear} ${LEAGUE} season starts on ${seasonStartFormatted}.`,
			},
		},
	]

	return [
		{ title },
		{ name: 'description', content: description },
		{ property: 'og:title', content: title },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:url', content: url },
		{ property: 'og:description', content: description },
		{ property: 'og:site_name', content: 'Team Countdown' },
		{ tagName: 'link', rel: 'canonical', href: url },
		{ 'script:ld+json': generateBreadcrumbSchema(breadcrumbItems) },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'FAQPage',
				mainEntity: faqEntities,
			},
		},
	]
}

export async function loader({ params }: LoaderFunctionArgs) {
	const LEAGUE = params.league?.toUpperCase() ?? 'NFL'

	if (!SUPPORTED_LEAGUES.includes(LEAGUE)) {
		throw new Response(null, { status: 404 })
	}

	const [{ date, isMidSeason }, teams] = await Promise.all([
		getSeasonStartDate(LEAGUE),
		getTeams(LEAGUE),
	])
	const meta = LEAGUE_SEASON_META[LEAGUE]
	const now = new Date()
	const seasonStartYear = isMidSeason
		? meta && ['NBA', 'NHL', 'PWHL'].includes(LEAGUE)
			? now.getFullYear() - 1
			: now.getFullYear()
		: date.getFullYear()
	const crossYear = ['NBA', 'NHL', 'PWHL'].includes(LEAGUE)
	const seasonYear = crossYear
		? `${seasonStartYear}-${String(seasonStartYear + 1).slice(2)}`
		: String(seasonStartYear)

	return json({
		LEAGUE,
		teams,
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

export default function SeasonCountdown() {
	const { LEAGUE, teams, seasonStartDate, seasonYear } =
		useLoaderData<typeof loader>()

	const meta = LEAGUE_SEASON_META[LEAGUE]

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: LEAGUE, href: `/${LEAGUE.toLowerCase()}` },
		{ label: 'Season Countdown' },
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
				<Countdown
					pageTitle={`${LEAGUE} Season Countdown ${seasonYear}`}
					teams={teams}
					game={seasonGame}
					isTeamPage={false}
					breadcrumbItems={breadcrumbItems}
					teamPickerTeams={teams}
					leagueBrandColor={meta?.brandColor}
				/>
				<Footer league={LEAGUE} dark />
			</div>
		</>
	)
}
