import mlbSchedule from '../../mlb_schedule.json'
import mlbTeams from '../../mlb_teams.json'
import mlbColors from '../../mlb_colors.json'

type MlbGame = (typeof mlbSchedule)['dates'][0]['games'][0]
type MlbTeam = (typeof mlbTeams)['teams'][0]

type IsoDateString = string

type Team = {
	id: number
	nickName: string
	fullName: string
	abbreviation: string
	primaryColor: string
	secondaryColor: string
}

type Game = {
	id: string
	time: IsoDateString
	homeTeam: Team
	awayTeam: Team
}

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
}: MlbGame): Game {
	const mlbHomeTeam_ = mlbTeams.teams.find(
		(t) => t.id === mlbHomeTeam.id
	) as MlbTeam
	const homeTeam = mlbTeamToTeam(mlbHomeTeam_)
	const mlbAwayTeam_ = mlbTeams.teams.find(
		(t) => t.id === mlbAwayTeam.id
	) as MlbTeam
	const awayTeam = mlbTeamToTeam(mlbAwayTeam_)

	return {
		id: gameGuid,
		time: gameDate,
		homeTeam,
		awayTeam,
	}
}
