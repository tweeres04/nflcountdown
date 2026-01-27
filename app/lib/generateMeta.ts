import { MetaFunction } from '@remix-run/node'
import type { Game, Team } from './types'
import {
	generateSportsTeamSchema,
	generateSportsEventSchema,
} from './schema-helpers'
import { getGameSlug } from './getGameSlug'

interface MetaParams {
	LEAGUE: string
	team: Team
	game?: Game // For game pages - the specific game being viewed
	nextGame?: Game // For team pages - the upcoming game (for schema)
}

export const generateMeta: MetaFunction = ({ data, params }) => {
	const { LEAGUE, team, game, nextGame } = data as MetaParams
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const lowercaseLeague = LEAGUE.toLowerCase()

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

	const ogImage = `https://teamcountdown.com/${lowercaseLeague}/og/${lowercaseAbbreviation}`
	const url = `https://teamcountdown.com/${lowercaseLeague}/${lowercaseAbbreviation}${
		game ? `/${params.gameSlug}` : ''
	}`

	const metaTags: any[] = [
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

	// Add structured data
	if (game) {
		// Game page - SportsEvent schema only
		const schema = generateSportsEventSchema(game, team, LEAGUE, url)
		if (schema) {
			metaTags.push({ 'script:ld+json': schema })
		}
	} else {
		// Team page - SportsTeam schema
		const teamSchema = generateSportsTeamSchema(team, LEAGUE, url)
		metaTags.push({ 'script:ld+json': teamSchema })

		// Also add SportsEvent schema for the next game (if available)
		if (nextGame) {
			const gameSlug = getGameSlug(nextGame, team.abbreviation)
			if (gameSlug) {
				const gameUrl = `https://teamcountdown.com/${lowercaseLeague}/${lowercaseAbbreviation}/${gameSlug}`
				const eventSchema = generateSportsEventSchema(
					nextGame,
					team,
					LEAGUE,
					gameUrl
				)
				if (eventSchema) {
					metaTags.push({ 'script:ld+json': eventSchema })
				}
			}
		}
	}

	return metaTags
}
