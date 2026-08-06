import { readFile } from 'node:fs/promises'
import mlbTeams from '../../mlb_teams.json'
import { uniqBy, orderBy } from 'lodash-es'
import { mlbTeamToTeam } from './mlbGameToGame'
import { nbaTeamToTeam } from './nbaGameToGame'
import { nflTeamToTeam } from './nflGameToGame'
import { nhlTeamToTeam } from './nhlGameToGame'
import { wnbaTeamToTeam } from './wnbaGameToGame'
import { cplTeamToTeam } from './cplGameToGame'
import { cflTeamToTeam } from './cflGameToGame'
import { nslTeamToTeam } from './nslGameToGame'
import { ceblTeamToTeam } from './ceblGameToGame'
import { mlsTeamToTeam } from './mlsGameToGame'
import { nwslTeamToTeam } from './nwslGameToGame'
import { pwhlTeamToTeam } from './pwhlGameToGame'
import { cfbTeamToTeam } from './cfbGameToGame'
import { worldCupTeamToTeam } from './worldCupGameToGame'
import { wwcTeamToTeam } from './wwcGameToGame'
import { getAllGames } from './getAllGames'
import { NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, CplScheduleApi, CflScheduleApi, NslScheduleApi, CeblScheduleApi, MlsScheduleApi, NwslScheduleApi, PwhlScheduleApi, CfbScheduleApi, WorldCupScheduleApi, WwcScheduleApi, WwcTeamApi, Team } from './types'

export async function getTeamAndGames(
	league: string | undefined,
	teamAbbrev: string | undefined
) {
	const LEAGUE = league?.toUpperCase() ?? 'NFL'

	// Validate league
	if (!['NFL', 'NBA', 'MLB', 'NHL', 'WNBA', 'CPL', 'CFL', 'NSL', 'CEBL', 'MLS', 'NWSL', 'PWHL', 'CFB', 'WORLDCUP', 'WWC'].includes(LEAGUE)) {
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
	} else if (LEAGUE === 'CEBL') {
		const raw = await readFile('data/cebl_schedule.json', 'utf-8')
		const ceblSchedule: CeblScheduleApi = JSON.parse(raw)
		teams = uniqBy(ceblSchedule.games, 'home_team_id').map((g) =>
			ceblTeamToTeam(g.home_team_id, g.home_team_name)
		)
	} else if (LEAGUE === 'CFL') {
		const raw = await readFile('data/cfl_schedule.json', 'utf-8')
		const cflSchedule: CflScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			cflSchedule.rounds.flatMap((r) => r.tournaments).map((g) => g.homeSquad),
			'id'
		).map(cflTeamToTeam)
	} else if (LEAGUE === 'NSL') {
		const raw = await readFile('data/nsl_schedule.json', 'utf-8')
		const nslSchedule: NslScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			nslSchedule.events.flatMap((e) =>
				e.competitions[0].competitors.map((c) => c.team)
			),
			'id'
		).map(nslTeamToTeam)
	} else if (LEAGUE === 'MLS') {
		const raw = await readFile('data/mls_schedule.json', 'utf-8')
		const mlsSchedule: MlsScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			mlsSchedule.events.flatMap((e) => 
				e.competitions[0].competitors.map(c => c.team)
			),
			'id'
		).map(mlsTeamToTeam)
	} else if (LEAGUE === 'NWSL') {
		const raw = await readFile('data/nwsl_schedule.json', 'utf-8')
		const nwslSchedule: NwslScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			nwslSchedule.events.flatMap((e) =>
				e.competitions[0].competitors.map(c => c.team)
			),
			'id'
		).map(nwslTeamToTeam)
	} else if (LEAGUE === 'PWHL') {
		const raw = await readFile('data/pwhl_schedule.json', 'utf-8')
		const pwhlSchedule: PwhlScheduleApi = JSON.parse(raw)
		teams = uniqBy(pwhlSchedule.SiteKit.Scorebar, 'HomeID').map((g) =>
			pwhlTeamToTeam(g.HomeID, g.HomeCode, g.HomeCity, g.HomeNickname, g.HomeLongName)
		)
	} else if (LEAGUE === 'CFB') {
		const raw = await readFile('data/cfb_schedule.json', 'utf-8')
		const cfbSchedule: CfbScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			cfbSchedule.events.flatMap((e) =>
				e.competitions[0].competitors.map((c) => c.team)
			),
			'id'
		).map(cfbTeamToTeam)
	} else if (LEAGUE === 'WORLDCUP') {
		const raw = await readFile('data/worldcup_schedule.json', 'utf-8')
		const wcSchedule: WorldCupScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			wcSchedule.Results.flatMap((m) => [m.Home, m.Away]).filter(
				(t): t is NonNullable<typeof t> => t !== null && !!t.IdTeam
			),
			'IdTeam'
		)
			.map(worldCupTeamToTeam)
			.filter((t): t is Team => t !== null)
	} else if (LEAGUE === 'WWC') {
		const raw = await readFile('data/wwc_schedule.json', 'utf-8')
		const wwcSchedule: WwcScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			wwcSchedule.Results.flatMap((m) => [m.Home, m.Away]).filter(
				(t): t is WwcTeamApi => t !== null && !!t.IdTeam
			),
			'IdTeam'
		)
			.map(wwcTeamToTeam)
			.filter((t): t is Team => t !== null)
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
