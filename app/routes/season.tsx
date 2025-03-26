import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { addDays, getYear, nextMonday, startOfMonth, isFuture } from 'date-fns'
import Countdown from '~/components/countdown'
import { getTeamAndGames } from '~/lib/getTeamAndGames'

export function meta() {
	const title = 'How Many Days Till NFL Kickoff? Live NFL Season Countdown'
	const description =
		'Find out exactly how many days until NFL season starts. Live countdown showing the precise days, hours, and minutes until NFL football returns in 2025.'

	return [
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
			content: 'https://nflcountdown.tweeres.com/season',
		},
		{
			name: 'og:image',
			content: 'https://nflcountdown.tweeres.com/og.png',
		},
		{
			name: 'og:description',
			content: description,
		},
		{ name: 'og:site_name', content: 'NFL Countdown' },
		{
			tagName: 'link',
			rel: 'canonical',
			href: 'https://nflcountdown.tweeres.com/season',
		},
	]
}

function getNextSeasonStartDate() {
	const today = new Date()
	const currentYear = getYear(today)

	// First Monday of September in currentYear
	const firstMondayOfSeptember = nextMonday(
		startOfMonth(new Date(currentYear, 8, 1))
	)

	// Weekend following the first Monday (Thursday)
	const seasonStartDate = addDays(firstMondayOfSeptember, 3)
	// Set time to 8:15 PM EDT (UTC-4)
	seasonStartDate.setUTCHours(20 + 4, 15, 0, 0) // Adding 4 hours to convert from EDT to UTC

	// If this date has already passed, use next year
	if (!isFuture(seasonStartDate)) {
		const nextYearFirstMondayOfSeptember = nextMonday(
			startOfMonth(new Date(currentYear + 1, 8, 1))
		)
		return addDays(nextYearFirstMondayOfSeptember, 3)
	}

	return seasonStartDate
}

export async function loader() {
	const LEAGUE = process.env.LEAGUE

	if (LEAGUE?.toLowerCase() !== 'nfl') {
		throw new Response(null, { status: 404 })
	}

	const { teams } = getTeamAndGames('KC') // Todo: Shouldn't need to pass a team here

	return json({
		LEAGUE,
		teams,
	})
}

export default function SeasonCountdown() {
	const { teams } = useLoaderData<typeof loader>()

	const seasonStartDate = getNextSeasonStartDate()

	// Create a fake game object for the countdown component
	const seasonGame = {
		time: seasonStartDate.toISOString(),
	}

	return (
		<Countdown
			pageTitle="NFL Season Countdown"
			teams={teams}
			game={seasonGame}
			isTeamPage={false}
		/>
	)
}
