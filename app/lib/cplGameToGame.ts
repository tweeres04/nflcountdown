import cplSchedule from '../../cpl_schedule.json'
import cplColors from '../../cpl_colors.json'
import { Team, Game, CplTeamApi, CplScheduleApi } from './types'
import { uniqBy } from 'lodash-es'

const cplScheduleTyped = cplSchedule as unknown as CplScheduleApi

// Extract unique teams from home and away teams
const allTeams = cplScheduleTyped.matches.flatMap((match) => [
	match.home,
	match.away,
])
export const cplTeams = uniqBy(allTeams, 'teamId')

export function cplTeamToTeam({
	teamId,
	officialName,
	acronymName,
}: CplTeamApi): Team {
	const color = cplColors.find(
		(c) => c.abbreviation === acronymName
	) as (typeof cplColors)[0]

	if (!color) {
		console.error('No colors found for CPL team', officialName)
	}

	return {
		id: teamId,
		nickName: officialName,
		fullName: officialName,
		abbreviation: acronymName,
		primaryColor: color?.color_1 || '#000',
		secondaryColor: color?.color_2 || '#fff',
	}
}

/**
 * Transforms a CPL API match object to the unified Game type.
 * @param match - Raw match object from CPL API
 * @param viewingTeamAbbrev - Optional team abbreviation (e.g., 'PAC') of the team page being viewed.
 */
export function cplGameToGame(match: any, viewingTeamAbbrev?: string): Game {
	// CPL doesn't have broadcast info in the API, so we'll omit it
	return {
		id: match.matchId,
		time: match.matchDateUtc,
		homeTeam: cplTeamToTeam(match.home),
		awayTeam: cplTeamToTeam(match.away),
		startTimeTbd: false,
		broadcast: null,
	}
}
