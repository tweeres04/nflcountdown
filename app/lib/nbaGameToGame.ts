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

export function nbaGameToGame({
	gameId,
	gameDateTimeUTC,
	homeTeam,
	awayTeam,
}: NbaScheduleApi['leagueSchedule']['gameDates'][0]['games'][0]): Game {
	return {
		id: gameId,
		time: gameDateTimeUTC,
		homeTeam: nbaTeamToTeam(homeTeam),
		awayTeam: nbaTeamToTeam(awayTeam),
		startTimeTbd: false,
	}
}
