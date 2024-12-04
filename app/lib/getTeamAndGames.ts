import schedule from '../../nfl_schedule.json'
import mlbSchedule from '../../mlb_schedule.json'
import mlbTeams from '../../mlb_teams.json'
import nbaSchedule from '../../nba_schedule.json'
import { uniqBy, orderBy } from 'lodash-es'
import { mlbGameToGame, mlbTeamToTeam } from './mlbGameToGame'
import { nbaGameToGame, nbaTeams, nbaTeamToTeam } from './nbaGameToGame'
import { isAfter, subHours } from 'date-fns'

export function getTeamAndGames(teamAbbrev: string | undefined) {
	const LEAGUE = process.env.LEAGUE ?? 'NFL'
	let teams =
		LEAGUE === 'MLB'
			? mlbTeams.teams.map(mlbTeamToTeam)
			: LEAGUE === 'NBA'
			? nbaTeams.map(nbaTeamToTeam)
			: uniqBy(
					schedule.games.map((g) => g.homeTeam),
					'id'
			  )
	teams = orderBy(teams, 'fullName')

	const team = teams.find(
		(t) => t.abbreviation.toLowerCase() === teamAbbrev?.toLowerCase()
	)

	if (!team) {
		throw new Response(null, { status: 404 })
	}

	const games = (
		LEAGUE === 'MLB'
			? mlbSchedule.dates.flatMap((d) => d.games).map(mlbGameToGame)
			: LEAGUE === 'NBA'
			? nbaSchedule.leagueSchedule.gameDates
					.flatMap((gd) => gd.games)
					.filter((g) => g.homeTeam.teamId > 0)
					.map(nbaGameToGame)
			: schedule.games
	).filter((g) => g.homeTeam.id === team.id || g.awayTeam.id === team.id)

	return { LEAGUE, teams, team, games }
}
