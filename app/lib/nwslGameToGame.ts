import nwslColors from '../../nwsl_colors.json'
import { Team, Game, NwslTeamApi, NwslEventApi } from './types'

export function nwslTeamToTeam({
	id,
	abbreviation,
	displayName,
	shortDisplayName,
	color,
	alternateColor,
}: NwslTeamApi): Team {
	const colorData = nwslColors.find((c) => c.abbreviation === abbreviation)

	if (!colorData) {
		console.error('No colors found for NWSL team', displayName, abbreviation)
	}

	return {
		id: id,
		nickName: shortDisplayName,
		fullName: displayName,
		abbreviation: abbreviation,
		primaryColor: colorData?.color_1 || color || '#000000',
		secondaryColor: colorData?.color_2 || alternateColor || '#333333',
	}
}

/**
 * Transforms an ESPN NWSL API event object to the unified Game type.
 * @param event - Raw event object from ESPN API
 * @param viewingTeamAbbrev - Optional team abbreviation of the team page being viewed.
 */
export function nwslGameToGame(event: NwslEventApi, viewingTeamAbbrev?: string): Game {
	const competition = event.competitions[0]
	if (!competition) {
		throw new Error(`No competition found for event ${event.id}`)
	}

	const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home')
	const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away')

	if (!homeCompetitor || !awayCompetitor) {
		throw new Error(`Missing home or away competitor for event ${event.id}`)
	}

	const broadcasts = competition.broadcasts || []
	const broadcastNames = broadcasts.flatMap((b) => b.names).join(', ')

	return {
		id: event.id,
		time: event.date,
		homeTeam: nwslTeamToTeam(homeCompetitor.team),
		awayTeam: nwslTeamToTeam(awayCompetitor.team),
		startTimeTbd: false,
		broadcast: broadcastNames || null,
	}
}
