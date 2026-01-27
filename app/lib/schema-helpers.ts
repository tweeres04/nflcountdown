import { Team, Game } from './types'

export function getSportName(league: string): string {
	switch (league) {
		case 'NFL':
			return 'American Football'
		case 'NBA':
			return 'Basketball'
		case 'MLB':
			return 'Baseball'
		default:
			return 'Sports'
	}
}

export function getLeagueFullName(league: string): string {
	switch (league) {
		case 'NFL':
			return 'National Football League'
		case 'NBA':
			return 'National Basketball Association'
		case 'MLB':
			return 'Major League Baseball'
		default:
			return league
	}
}

export function getLeagueSameAs(league: string): string {
	const officialUrls: Record<string, string> = {
		NFL: 'https://www.nfl.com',
		NBA: 'https://www.nba.com',
		MLB: 'https://www.mlb.com',
	}
	return officialUrls[league] || ''
}

export function extractCityFromTeamName(teamFullName: string): string {
	// Extract city/region from team name
	// Examples: "Philadelphia Eagles" -> "Philadelphia"
	// "New York Yankees" -> "New York"
	// "Tampa Bay Buccaneers" -> "Tampa Bay"
	const parts = teamFullName.split(' ')
	// Take all words except the last one (which is usually the nickname)
	return parts.slice(0, -1).join(' ')
}

export function generateSportsTeamSchema(
	team: Team,
	league: string,
	url: string
) {
	const lowercaseLeague = league.toLowerCase()
	const lowercaseAbbrev = team.abbreviation.toLowerCase()

	return {
		'@context': 'https://schema.org',
		'@type': 'SportsTeam',
		name: team.fullName,
		sport: getSportName(league),
		url,
		logo: `https://teamcountdown.com/logos/${
			league === 'NFL' ? '' : `${lowercaseLeague}/`
		}${lowercaseAbbrev}.svg`,
		memberOf: {
			'@type': 'SportsOrganization',
			name: getLeagueFullName(league),
			sport: getSportName(league),
		},
	}
}

export function generateSportsEventSchema(
	game: Game,
	team: Team,
	league: string,
	url: string
) {
	const homeTeam = game.homeTeam
	const awayTeam = game.awayTeam

	if (!homeTeam || !awayTeam || !game.time) {
		return null // Can't create valid schema without required data
	}

	const lowercaseLeague = league.toLowerCase()
	const city = extractCityFromTeamName(homeTeam.fullName)

	return {
		'@context': 'https://schema.org',
		'@type': 'SportsEvent',
		name: `${homeTeam.fullName} vs ${awayTeam.fullName}`,
		description: `${league} game between ${homeTeam.fullName} and ${awayTeam.fullName}`,
		startDate: game.time,
		eventStatus: 'https://schema.org/EventScheduled',
		sport: getSportName(league),
		url,
		location: {
			'@type': 'Place',
			name: city,
			address: {
				'@type': 'PostalAddress',
				addressLocality: city,
			},
		},
		homeTeam: {
			'@type': 'SportsTeam',
			name: homeTeam.fullName,
			sport: getSportName(league),
			url: `https://teamcountdown.com/${lowercaseLeague}/${homeTeam.abbreviation.toLowerCase()}`,
		},
		awayTeam: {
			'@type': 'SportsTeam',
			name: awayTeam.fullName,
			sport: getSportName(league),
			url: `https://teamcountdown.com/${lowercaseLeague}/${awayTeam.abbreviation.toLowerCase()}`,
		},
		organizer: {
			'@type': 'SportsOrganization',
			name: getLeagueFullName(league),
			url: `https://teamcountdown.com/${lowercaseLeague}`,
		},
	}
}

export function generateSportsOrganizationSchema(league: string, url: string) {
	const lowercaseLeague = league.toLowerCase()
	const logoFile =
		league === 'NFL'
			? 'football'
			: lowercaseLeague === 'nba'
			? 'basketball'
			: 'baseball'

	return {
		'@context': 'https://schema.org',
		'@type': 'SportsOrganization',
		name: getLeagueFullName(league),
		alternateName: league,
		sport: getSportName(league),
		url,
		logo: `https://teamcountdown.com/${logoFile}.svg`,
		sameAs: [getLeagueSameAs(league)],
	}
}

export function generateWebSiteSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Team Countdown',
		url: 'https://teamcountdown.com',
		description:
			'The fastest and prettiest way to check the next NFL, NBA, or MLB game. Launches instantly from your home screen.',
		about: [
			{
				'@type': 'SportsOrganization',
				name: 'National Football League',
			},
			{
				'@type': 'SportsOrganization',
				name: 'National Basketball Association',
			},
			{
				'@type': 'SportsOrganization',
				name: 'Major League Baseball',
			},
		],
	}
}
