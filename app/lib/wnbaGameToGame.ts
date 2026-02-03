import wnbaSchedule from '../../wnba_schedule.json'
import wnbaColors from '../../wnba_colors.json'
import { Team, Game, WnbaTeamApi, WnbaScheduleApi } from './types'
import { uniqBy } from 'lodash-es'

const wnbaScheduleTyped = wnbaSchedule as unknown as WnbaScheduleApi
const wnbaGamesStatic = wnbaScheduleTyped.leagueSchedule.gameDates.flatMap(
	(gd) => gd.games
)

export const wnbaTeams = uniqBy(
	wnbaGamesStatic.map((g) => g.homeTeam),
	'teamId'
).filter((t) => t.teamId > 0)

export function wnbaTeamToTeam({
	teamId,
	teamCity,
	teamName,
	teamTricode,
}: WnbaTeamApi): Team {
	const color = wnbaColors.find(
		(c) => c.abbreviation === teamTricode
	) as (typeof wnbaColors)[0]

	if (!color) {
		console.error('No colors found for wnba team', teamCity, teamName)
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
 * Transforms a WNBA API game object to the unified Game type.
 * @param game - Raw game object from WNBA API
 * @param viewingTeamAbbrev - Optional team abbreviation (e.g., 'IND') of the team page being viewed.
 *                            Used to order broadcast networks - viewing team's local networks shown before opponent's.
 *                            If not provided, defaults to home team's networks first.
 */
export function wnbaGameToGame(game: any, viewingTeamAbbrev?: string): Game {
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
		homeTeam: wnbaTeamToTeam(game.homeTeam),
		awayTeam: wnbaTeamToTeam(game.awayTeam),
		startTimeTbd: false,
		broadcast,
	}
}
