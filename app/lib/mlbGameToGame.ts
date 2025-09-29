import mlbSchedule from '../../mlb_schedule.json'
import mlbTeams from '../../mlb_teams.json'
import mlbColors from '../../mlb_colors.json'

import { Game, Team } from './types'

type MlbGame = (typeof mlbSchedule)['dates'][0]['games'][0]
type MlbTeam = (typeof mlbTeams)['teams'][0]

export function mlbTeamToTeam({
	id,
	name,
	clubName,
	abbreviation,
}: MlbTeam): Team {
	const color = mlbColors.find(
		(c) => c.abbreviation === abbreviation
	) as (typeof mlbColors)[0]
	return {
		id,
		nickName: clubName,
		fullName: name,
		abbreviation,
		primaryColor: color.color_1,
		secondaryColor: color.color_2,
	}
}

export function mlbGameToGame({
	gameGuid,
	gameDate,
	teams: {
		home: { team: mlbHomeTeam },
		away: { team: mlbAwayTeam },
	},
	status: { startTimeTBD },
}: MlbGame): Game {
	const mlbHomeTeam_ = mlbTeams.teams.find((t) => t.id === mlbHomeTeam.id)
	const homeTeam = mlbHomeTeam_ ? mlbTeamToTeam(mlbHomeTeam_) : null
	const mlbAwayTeam_ = mlbTeams.teams.find((t) => t.id === mlbAwayTeam.id)
	const awayTeam = mlbAwayTeam_ ? mlbTeamToTeam(mlbAwayTeam_) : null

	return {
		id: gameGuid,
		time: gameDate,
		homeTeam,
		awayTeam,
		startTimeTbd: startTimeTBD,
	}
}
