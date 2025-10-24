import { MetaFunction } from '@remix-run/node'
import type { Game, Team } from './types'

interface MetaParams {
	LEAGUE: string
	team: Team
	game?: Game
}

export const generateMeta: MetaFunction = ({ data, params }) => {
	const { LEAGUE, team, game } = data as MetaParams
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()

	let title: string
	let description: string

	if (game) {
		const opponent =
			(game.homeTeam?.abbreviation === team.abbreviation
				? game.awayTeam?.fullName
				: game.homeTeam?.fullName) ?? 'TBD'

		const gameDateFormatted = game.time
			? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
					new Date(game.time)
			  )
			: ''
		const gameDateStringForTitle = game.time ? ` - ${gameDateFormatted}` : ''
		const gameDateStringForDescription = game.time
			? ` on ${gameDateFormatted}`
			: ''

		title = `${team.fullName} vs ${opponent}${gameDateStringForTitle} - ${LEAGUE} Countdown`
		description = `Countdown to ${team.fullName} vs ${opponent}${gameDateStringForDescription}. Launches instantly from your home screen.`
	} else {
		title = `When is the next ${team.fullName} game? - ${LEAGUE} Countdown`
		description = `The fastest and prettiest way to check the next ${team.fullName} game. Launches instantly from your home screen.`
	}

	const ogImage = `https://${LEAGUE.toLowerCase()}countdown.tweeres.com/og/${lowercaseAbbreviation}`
	const url = `https://${LEAGUE.toLowerCase()}countdown.tweeres.com/${lowercaseAbbreviation}${
		game ? `/${params.gameSlug}` : ''
	}`

	return [
		{ title },
		{ name: 'description', content: description },
		{ name: 'theme-color', content: team.primaryColor },
		{ name: 'og:title', content: title },
		{ name: 'og:type', content: 'website' },
		{ name: 'og:url', content: url },
		{ name: 'og:image', content: ogImage },
		{ name: 'og:description', content: description },
		{ name: 'og:site_name', content: `${LEAGUE} Countdown` },
		{ tagName: 'link', rel: 'canonical', href: url },
	]
}
