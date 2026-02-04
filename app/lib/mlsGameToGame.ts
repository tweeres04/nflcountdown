import mlsColors from '../../mls_colors.json'
import { Team, Game, MlsTeamApi, MlsEventApi } from './types'

export function mlsTeamToTeam({
	id,
	abbreviation,
	displayName,
	shortDisplayName,
	color,
	alternateColor,
}: MlsTeamApi): Team {
	const colorData = mlsColors.find((c) => c.abbreviation === abbreviation)

	if (!colorData) {
		console.error('No colors found for MLS team', displayName, abbreviation)
	}

	return {
		id: id,
		nickName: shortDisplayName, // "Seattle" instead of "Seattle Sounders FC"
		fullName: displayName, // "Seattle Sounders FC"
		abbreviation: abbreviation,
		primaryColor: colorData?.primaryColor || color || '000000',
		secondaryColor: colorData?.secondaryColor || alternateColor || 'ffffff',
	}
}

/**
 * Transforms an ESPN MLS API event object to the unified Game type.
 * @param event - Raw event object from ESPN API
 * @param viewingTeamAbbrev - Optional team abbreviation (e.g., 'SEA') of the team page being viewed.
 */
export function mlsGameToGame(event: MlsEventApi, viewingTeamAbbrev?: string): Game {
	const competition = event.competitions[0]
	if (!competition) {
		throw new Error(`No competition found for event ${event.id}`)
	}

	const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home')
	const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away')

	if (!homeCompetitor || !awayCompetitor) {
		throw new Error(`Missing home or away competitor for event ${event.id}`)
	}

	// Extract broadcast info (usually Apple TV for MLS)
	const broadcasts = competition.broadcasts || []
	const broadcastNames = broadcasts.flatMap((b) => b.names).join(', ')

	return {
		id: event.id,
		time: event.date,
		homeTeam: mlsTeamToTeam(homeCompetitor.team),
		awayTeam: mlsTeamToTeam(awayCompetitor.team),
		startTimeTbd: false, // ESPN API includes exact times
		broadcast: broadcastNames || null,
	}
}
