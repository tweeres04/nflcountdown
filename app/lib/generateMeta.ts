import { MetaFunction } from '@remix-run/node'
import type { Game, Team } from './types'
import {
	generateSportsTeamSchema,
	generateSportsEventSchema,
	generateBreadcrumbSchema,
	type BreadcrumbItem,
} from './schema-helpers'
import { getGameSlug } from './getGameSlug'

interface MetaParams {
	LEAGUE: string
	team: Team
	game?: Game // For game pages - the specific game being viewed
	nextGame?: Game // For team pages - the upcoming game (for schema)
	breadcrumbItems?: BreadcrumbItem[] // For breadcrumb schema
}

// Leagues where Google shows sports cards for "next game" queries,
// making those queries unwinnable. Target "[team] countdown" instead.
export const BIG_LEAGUES = new Set([
	'NFL',
	'MLB',
	'NBA',
	'NHL',
	'MLS',
	'WNBA',
	'CFB',
])

export function getSeasonYear(): string {
	const now = new Date()
	return String(now.getFullYear())
}

export function getTeamNextGameDescription(
	team: Team,
	nextGame: Game | undefined
): string {
	if (!nextGame?.time) return ''
	const opponent =
		(nextGame.homeTeam?.abbreviation === team.abbreviation
			? nextGame.awayTeam?.fullName
			: nextGame.homeTeam?.fullName) ?? 'TBD'
	const dateFormatted = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
	}).format(new Date(nextGame.time))
	return `Next game: vs ${opponent} on ${dateFormatted}.`
}

export function generateTitle(
	team: Team,
	league: string,
	year: string,
	game?: Game
): string {
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
		return `${team.fullName} vs ${opponent}${gameDateStringForTitle} - Team Countdown`
	}

	if (BIG_LEAGUES.has(league)) {
		return `${team.fullName} Countdown - Team Countdown`
	}

	return `When is the Next ${team.fullName} Game? - Team Countdown`
}

export function generateDescription(
	team: Team,
	league: string,
	game?: Game,
	nextGame?: Game
): string {
	if (game) {
		const opponent =
			(game.homeTeam?.abbreviation === team.abbreviation
				? game.awayTeam?.fullName
				: game.homeTeam?.fullName) ?? 'TBD'
		const gameDateStringForDescription = game.time
			? ` on ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
					new Date(game.time)
			  )}`
			: ''
		return `Countdown to ${team.fullName} vs ${opponent}${gameDateStringForDescription}. Launches instantly from your home screen.`
	}

	const nextGameInfo = getTeamNextGameDescription(team, nextGame)
	return `Live countdown to the next ${team.fullName} game. ${nextGameInfo} Add to your home screen for instant access.`
}

export function generateTeamFaqSchema(team: Team, nextGame?: Game): object {
	const faqEntities: object[] = []

	if (nextGame?.time) {
		const opponent =
			(nextGame.homeTeam?.abbreviation === team.abbreviation
				? nextGame.awayTeam?.fullName
				: nextGame.homeTeam?.fullName) ?? 'TBD'
		const dateFormatted = new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: nextGame.startTimeTbd ? undefined : 'numeric',
			minute: nextGame.startTimeTbd ? undefined : 'numeric',
		}).format(new Date(nextGame.time))

		faqEntities.push({
			'@type': 'Question',
			name: `When is the next ${team.fullName} game?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: `The next ${team.fullName} game is ${opponent} on ${dateFormatted}.`,
			},
		})

		if (nextGame.broadcast) {
			faqEntities.push({
				'@type': 'Question',
				name: `What channel is the ${team.fullName} game on?`,
				acceptedAnswer: {
					'@type': 'Answer',
					text: `The next ${team.fullName} game will air on ${nextGame.broadcast}.`,
				},
			})
		}
	} else {
		faqEntities.push({
			'@type': 'Question',
			name: `When is the next ${team.fullName} game?`,
			acceptedAnswer: {
				'@type': 'Answer',
				text: `The ${team.fullName} schedule has not been announced yet. Check back for updates.`,
			},
		})
	}

	faqEntities.push({
		'@type': 'Question',
		name: `How many days until the next ${team.fullName} game?`,
		acceptedAnswer: {
			'@type': 'Answer',
			text: `Use the live countdown above for the exact days, hours, minutes, and seconds until the next ${team.fullName} game.`,
		},
	})

	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqEntities,
	}
}

export const generateMeta: MetaFunction = ({ data, params }) => {
	if (!data) return []
	const { LEAGUE, team, game, nextGame, breadcrumbItems } = data as MetaParams
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const lowercaseLeague = LEAGUE.toLowerCase()
	const year = getSeasonYear()

	const title = generateTitle(team, LEAGUE, year, game, nextGame)
	const description = generateDescription(team, LEAGUE, game, nextGame)

	// Rotate OG image URL every 2 hours so social platforms re-fetch fresh countdowns
	const twoHourBlock = Math.floor(Date.now() / (2 * 60 * 60 * 1000))
	const ogImage = `https://teamcountdown.com/${lowercaseLeague}/og/${lowercaseAbbreviation}?v=${twoHourBlock}`
	const url = `https://teamcountdown.com/${lowercaseLeague}/${lowercaseAbbreviation}${
		game ? `/${params.gameSlug}` : ''
	}`

	const metaTags: any[] = [
		{ title },
		{ name: 'description', content: description },
		{ name: 'theme-color', content: team.primaryColor },
		{ property: 'og:title', content: title },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:url', content: url },
		{ property: 'og:image', content: ogImage },
		{ property: 'og:description', content: description },
		{ property: 'og:site_name', content: 'Team Countdown' },
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

		// FAQ schema for team pages
		metaTags.push({
			'script:ld+json': generateTeamFaqSchema(team, nextGame),
		})
	}

	// Add breadcrumb schema if available
	if (breadcrumbItems && breadcrumbItems.length >= 2) {
		metaTags.push({
			'script:ld+json': generateBreadcrumbSchema(breadcrumbItems),
		})
	}

	return metaTags
}
