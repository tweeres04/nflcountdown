import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getYear } from 'date-fns'
import Countdown from '~/components/countdown'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { generateBreadcrumbSchema } from '~/lib/schema-helpers'
import { getNflSeasonStartDate } from '~/lib/getNflSeasonStartDate'

export function meta() {
	const title = 'How Many Days Till NFL Kickoff? Live NFL Season Countdown'
	const description = `Find out exactly how many days until NFL season starts. Live countdown showing the precise days, hours, and minutes until NFL football returns in ${getNflSeasonStartDate().getFullYear()}.`
	const url = 'https://teamcountdown.com/nfl/season'

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: 'NFL', href: '/nfl' },
		{ label: 'Season Countdown' },
	]

	const metaTags: any[] = [
		{ title },
		{
			name: 'description',
			content: description,
		},
		{
			name: 'og:title',
			content: title,
		},
		{ name: 'og:type', content: 'website' },
		{
			name: 'og:url',
			content: url,
		},
		{
			name: 'og:image',
			content: 'https://teamcountdown.com/og.png',
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
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				name: 'NFL Season Countdown',
				description: description,
				url: url,
				about: {
					'@type': 'SportsOrganization',
					name: 'National Football League',
				},
			},
		},
		{
			'script:ld+json': generateBreadcrumbSchema(breadcrumbItems),
		},
	]

	return metaTags
}

export async function loader() {
	// Season countdown is only for NFL
	const { teams } = await getTeamAndGames('nfl', 'KC') // Todo: Shouldn't need to pass a team here

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: 'NFL', href: '/nfl' },
		{ label: 'Season Countdown' }, // No href = current page
	]

	return json({
		LEAGUE: 'NFL',
		teams,
		breadcrumbItems,
	})
}

export default function SeasonCountdown() {
	const { teams, breadcrumbItems } = useLoaderData<typeof loader>()

	const seasonStartDate = getNflSeasonStartDate()

	// Create a fake game object for the countdown component
	const seasonGame = {
		id: 'season-start',
		time: seasonStartDate.toISOString(),
		homeTeam: null,
		awayTeam: null,
		startTimeTbd: false,
	}

	return (
		<Countdown
			pageTitle="NFL Season Countdown"
			teams={teams}
			game={seasonGame}
			isTeamPage={false}
			breadcrumbItems={breadcrumbItems}
		/>
	)
}
