import nbaSchedule from '../../nba_schedule.json'
import nbaColors from '../../nba_colors.json'
import { Team, Game, NbaTeamApi, NbaScheduleApi } from './types'
import { uniqBy } from 'lodash-es'

const nbaScheduleTyped = nbaSchedule as unknown as NbaScheduleApi
const nbaGamesStatic = nbaScheduleTyped.leagueSchedule.gameDates.flatMap(
	(gd) => gd.games
)

export const nbaTeams = uniqBy(
	nbaGamesStatic.map((g) => g.homeTeam),
	'teamId'
).filter((t) => t.teamId > 0)

export function nbaTeamToTeam({
	teamId,
	teamCity,
	teamName,
	teamTricode,
}: NbaTeamApi): Team {
	const color = nbaColors.find(
		(c) => c.abbreviation === teamTricode
	) as (typeof nbaColors)[0]

	if (!color) {
		console.error('No colors found for nba team', teamCity, teamName)
	}

	return {
		id: teamId,
		nickName: teamName,
		fullName: `${teamCity} ${teamName}`,
		abbreviation: teamTricode,
		primaryColor: color?.color_1 || '#000',
		secondaryColor: color?.color_2 || '#fff',
	}
}

/**
 * Transforms an NBA API game object to the unified Game type.
 * @param game - Raw game object from NBA API
 * @param viewingTeamAbbrev - Optional team abbreviation (e.g., 'LAL') of the team page being viewed.
 *                            Used to order broadcast networks - viewing team's local networks shown before opponent's.
 *                            If not provided, defaults to home team's networks first.
 */
export function nbaGameToGame(game: any, viewingTeamAbbrev?: string): Game {
	// Determine if viewing team is home or away
	const isViewingHome = viewingTeamAbbrev === game.homeTeam.teamTricode
	
	// Extract all broadcast types
	const national = game.broadcasters?.nationalTvBroadcasters?.map((b: any) => b.broadcasterDisplay).filter(Boolean) || []
	const home = game.broadcasters?.homeTvBroadcasters?.map((b: any) => b.broadcasterDisplay).filter(Boolean) || []
	const away = game.broadcasters?.awayTvBroadcasters?.map((b: any) => b.broadcasterDisplay).filter(Boolean) || []
	
	// Order: National first, then viewing team's local, then opponent's local
	// If no viewing team, default to home first
	const ordered = viewingTeamAbbrev === undefined
		? [...national, ...home, ...away]
		: isViewingHome
			? [...national, ...home, ...away]
			: [...national, ...away, ...home]
	
	// Dedupe while preserving order
	const broadcast = ordered.length > 0 ? [...new Set(ordered)].join(', ') : null
	
	return {
		id: game.gameId,
		time: game.gameDateTimeUTC,
		homeTeam: nbaTeamToTeam(game.homeTeam),
		awayTeam: nbaTeamToTeam(game.awayTeam),
		startTimeTbd: false,
		broadcast,
	}
}
