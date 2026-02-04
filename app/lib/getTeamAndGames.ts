import { readFile } from 'node:fs/promises'
import mlbTeams from '../../mlb_teams.json'
import { uniqBy, orderBy } from 'lodash-es'
import { mlbTeamToTeam } from './mlbGameToGame'
import { nbaTeamToTeam } from './nbaGameToGame'
import { nflTeamToTeam } from './nflGameToGame'
import { nhlTeamToTeam } from './nhlGameToGame'
import { wnbaTeamToTeam } from './wnbaGameToGame'
import { cplTeamToTeam } from './cplGameToGame'
import { getAllGames } from './getAllGames'
import { NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, CplScheduleApi, Team } from './types'

export async function getTeamAndGames(
	league: string | undefined,
	teamAbbrev: string | undefined
) {
	const LEAGUE = league?.toUpperCase() ?? 'NFL'

	// Validate league
	if (!['NFL', 'NBA', 'MLB', 'NHL', 'WNBA', 'CPL'].includes(LEAGUE)) {
		throw new Response(null, { status: 404 })
	}

	// Get teams list (need to load schedule for NBA/NFL to extract teams)
	let teams: Team[] = []
	
	if (LEAGUE === 'MLB') {
		teams = mlbTeams.teams.map(mlbTeamToTeam)
	} else if (LEAGUE === 'NBA') {
		const raw = await readFile('data/nba_schedule.json', 'utf-8')
		const nbaSchedule: NbaScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			nbaSchedule.leagueSchedule.gameDates
				.flatMap((gd) => gd.games)
				.map((g) => g.homeTeam),
			'teamId'
		)
			.filter((t) => t.teamId > 0)
			.map(nbaTeamToTeam)
	} else if (LEAGUE === 'NFL') {
		const raw = await readFile('data/nfl_schedule.json', 'utf-8')
		const nflSchedule: NflScheduleApi = JSON.parse(raw)
		teams = uniqBy(nflSchedule.games.map((g) => g.homeTeam), 'id').map(
			nflTeamToTeam
		)
	} else if (LEAGUE === 'NHL') {
		const raw = await readFile('data/nhl_schedule.json', 'utf-8')
		const nhlSchedule: NhlScheduleApi = JSON.parse(raw)
		teams = uniqBy(nhlSchedule.games.map((g) => g.homeTeam), 'id').map(
			nhlTeamToTeam
		)
	} else if (LEAGUE === 'WNBA') {
		const raw = await readFile('data/wnba_schedule.json', 'utf-8')
		const wnbaSchedule: WnbaScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			wnbaSchedule.leagueSchedule.gameDates
				.flatMap((gd) => gd.games)
				.map((g) => g.homeTeam),
			'teamId'
		)
			.filter((t) => t.teamId > 0)
			.map(wnbaTeamToTeam)
	} else if (LEAGUE === 'CPL') {
		const raw = await readFile('data/cpl_schedule.json', 'utf-8')
		const cplSchedule: CplScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			cplSchedule.matches.flatMap((m) => [m.home, m.away]),
			'teamId'
		).map(cplTeamToTeam)
	}

	teams = orderBy(teams, 'fullName')

	const team = teams.find(
		(t) => t.abbreviation.toLowerCase() === teamAbbrev?.toLowerCase()
	)

	if (!team) {
		throw new Response(null, { status: 404 })
	}

	// Load all games and filter to this team's games
	const allGames = await getAllGames(LEAGUE, teamAbbrev?.toUpperCase())
	const games = allGames.filter(
		(g) => g.homeTeam?.id === team.id || g.awayTeam?.id === team.id
	)

	return { LEAGUE, teams, team, games }
}
