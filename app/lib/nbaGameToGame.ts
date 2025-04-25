import nbaSchedule from '../../data/nba_schedule.json'
import nbaColors from '../../nba_colors.json'
import { Team, Game } from './types'
import { uniqBy } from 'lodash-es'

const nbaGames = nbaSchedule.leagueSchedule.gameDates.flatMap((gd) => gd.games)

export const nbaTeams = uniqBy(
	nbaGames.map((g) => g.homeTeam),
	'teamId'
).filter((t) => t.teamId > 0)

type NbaGame = (typeof nbaGames)[0]
type NbaTeam = (typeof nbaTeams)[0]

export function nbaTeamToTeam({
	teamId,
	teamCity,
	teamName,
	teamTricode,
}: NbaTeam): Team {
	const color = nbaColors.find(
		(c) => c.abbreviation === teamTricode
	) as (typeof nbaColors)[0]
	return {
		id: teamId,
		nickName: teamName,
		fullName: `${teamCity} ${teamName}`,
		abbreviation: teamTricode,
		primaryColor: color.color_1,
		secondaryColor: color.color_2,
	}
}

export function nbaGameToGame({
	gameId,
	gameDateTimeUTC,
	homeTeam: nbaHomeTeam,
	awayTeam: nbaAwayTeam,
}: NbaGame): Game {
	const nbaHomeTeam_ = nbaTeams.find(
		(t) => t.teamId === nbaHomeTeam.teamId
	) as NbaTeam
	const homeTeam = nbaTeamToTeam(nbaHomeTeam_)
	const nbaAwayTeam_ = nbaTeams.find(
		(t) => t.teamId === nbaAwayTeam.teamId
	) as NbaTeam
	const awayTeam = nbaTeamToTeam(nbaAwayTeam_)

	return {
		id: gameId,
		time: gameDateTimeUTC,
		homeTeam,
		awayTeam,
	}
}
