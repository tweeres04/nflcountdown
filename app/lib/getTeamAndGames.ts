import { readFile } from 'node:fs/promises'
import mlbTeams from '../../mlb_teams.json'
import { uniqBy, orderBy } from 'lodash-es'
import { mlbGameToGame, mlbTeamToTeam } from './mlbGameToGame'
import { nbaGameToGame, nbaTeamToTeam } from './nbaGameToGame'
import { nflGameToGame, nflTeamToTeam } from './nflGameToGame'
import { MlbScheduleApi, NbaScheduleApi, NflScheduleApi, Team, Game } from './types'

export async function getTeamAndGames(
	league: string | undefined,
	teamAbbrev: string | undefined
) {
	const LEAGUE = league?.toUpperCase() ?? 'NFL'
	
	// Validate league
	if (!['NFL', 'NBA', 'MLB'].includes(LEAGUE)) {
		throw new Response(null, { status: 404 })
	}
	
	let nbaSchedule: NbaScheduleApi | undefined
	if (LEAGUE === 'NBA') {
		const raw = await readFile('data/nba_schedule.json', 'utf-8')
		nbaSchedule = JSON.parse(raw)
	}
	let mlbSchedule: MlbScheduleApi | undefined
	if (LEAGUE === 'MLB') {
		const raw = await readFile('data/mlb_schedule.json', 'utf-8')
		mlbSchedule = JSON.parse(raw)
	}
	let nflSchedule: NflScheduleApi | undefined
	if (LEAGUE === 'NFL') {
		const raw = await readFile('data/nfl_schedule.json', 'utf-8')
		nflSchedule = JSON.parse(raw)
	}

	let teams: Team[] =
		LEAGUE === 'MLB'
			? mlbTeams.teams.map(mlbTeamToTeam)
			: LEAGUE === 'NBA' && nbaSchedule
			? uniqBy(
					nbaSchedule.leagueSchedule.gameDates
						.flatMap((gd) => gd.games)
						.map((g) => g.homeTeam),
					'teamId'
			  )
					.filter((t) => t.teamId > 0)
					.map(nbaTeamToTeam)
			: nflSchedule
			? uniqBy(
					nflSchedule.games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)
			: []

	teams = orderBy(teams, 'fullName')

	const team = teams.find(
		(t) => t.abbreviation.toLowerCase() === teamAbbrev?.toLowerCase()
	)

	if (!team) {
		throw new Response(null, { status: 404 })
	}

	const games: Game[] = (
		LEAGUE === 'MLB' && mlbSchedule
			? mlbSchedule.dates.flatMap((d) => d.games).map(mlbGameToGame)
			: LEAGUE === 'NBA' && nbaSchedule
			? nbaSchedule.leagueSchedule.gameDates
					.flatMap((gd) => gd.games)
					.filter((g) => g.homeTeam.teamId > 0)
					.filter((g) => g.gameLabel !== 'Preseason')
					.map(nbaGameToGame)
			: nflSchedule
			? nflSchedule.games.map(nflGameToGame)
			: []
	).filter((g) => g.homeTeam?.id === team.id || g.awayTeam?.id === team.id)

	return { LEAGUE, teams, team, games }
}
