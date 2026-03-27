import { readFile } from 'node:fs/promises'
import mlbTeams from '../../mlb_teams.json'
import { uniqBy, orderBy } from 'lodash-es'
import { mlbTeamToTeam } from './mlbGameToGame'
import { nbaTeamToTeam } from './nbaGameToGame'
import { nflTeamToTeam } from './nflGameToGame'
import { nhlTeamToTeam } from './nhlGameToGame'
import { wnbaTeamToTeam } from './wnbaGameToGame'
import { cplTeamToTeam } from './cplGameToGame'
import { mlsTeamToTeam } from './mlsGameToGame'
import { nwslTeamToTeam } from './nwslGameToGame'
import { pwhlTeamToTeam } from './pwhlGameToGame'
import { cfbTeamToTeam } from './cfbGameToGame'
import type {
	NbaScheduleApi,
	NflScheduleApi,
	NhlScheduleApi,
	WnbaScheduleApi,
	CplScheduleApi,
	MlsScheduleApi,
	NwslScheduleApi,
	PwhlScheduleApi,
	CfbScheduleApi,
	Team,
} from './types'

export async function getTeams(league: string): Promise<Team[]> {
	const LEAGUE = league.toUpperCase()
	let teams: Team[] = []

	if (LEAGUE === 'MLB') {
		teams = mlbTeams.teams.map(mlbTeamToTeam)
	} else if (LEAGUE === 'NBA') {
		const raw = await readFile('data/nba_schedule.json', 'utf-8')
		const schedule: NbaScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			schedule.leagueSchedule.gameDates
				.flatMap((gd) => gd.games)
				.map((g) => g.homeTeam),
			'teamId'
		)
			.filter((t) => t.teamId > 0)
			.map(nbaTeamToTeam)
	} else if (LEAGUE === 'NFL') {
		const raw = await readFile('data/nfl_schedule.json', 'utf-8')
		const schedule: NflScheduleApi = JSON.parse(raw)
		teams = uniqBy(schedule.games.map((g) => g.homeTeam), 'id').map(
			nflTeamToTeam
		)
	} else if (LEAGUE === 'NHL') {
		const raw = await readFile('data/nhl_schedule.json', 'utf-8')
		const schedule: NhlScheduleApi = JSON.parse(raw)
		teams = uniqBy(schedule.games.map((g) => g.homeTeam), 'id').map(
			nhlTeamToTeam
		)
	} else if (LEAGUE === 'WNBA') {
		const raw = await readFile('data/wnba_schedule.json', 'utf-8')
		const schedule: WnbaScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			schedule.leagueSchedule.gameDates
				.flatMap((gd) => gd.games)
				.map((g) => g.homeTeam),
			'teamId'
		)
			.filter((t) => t.teamId > 0)
			.map(wnbaTeamToTeam)
	} else if (LEAGUE === 'CPL') {
		const raw = await readFile('data/cpl_schedule.json', 'utf-8')
		const schedule: CplScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			schedule.matches.flatMap((m) => [m.home, m.away]),
			'teamId'
		).map(cplTeamToTeam)
	} else if (LEAGUE === 'MLS') {
		const raw = await readFile('data/mls_schedule.json', 'utf-8')
		const schedule: MlsScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			schedule.events.flatMap((e) =>
				e.competitions[0].competitors.map((c) => c.team)
			),
			'id'
		).map(mlsTeamToTeam)
	} else if (LEAGUE === 'NWSL') {
		const raw = await readFile('data/nwsl_schedule.json', 'utf-8')
		const schedule: NwslScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			schedule.events.flatMap((e) =>
				e.competitions[0].competitors.map((c) => c.team)
			),
			'id'
		).map(nwslTeamToTeam)
	} else if (LEAGUE === 'PWHL') {
		const raw = await readFile('data/pwhl_schedule.json', 'utf-8')
		const schedule: PwhlScheduleApi = JSON.parse(raw)
		teams = uniqBy(schedule.SiteKit.Scorebar, 'HomeID').map((g) =>
			pwhlTeamToTeam(
				g.HomeID,
				g.HomeCode,
				g.HomeCity,
				g.HomeNickname,
				g.HomeLongName
			)
		)
	} else if (LEAGUE === 'CFB') {
		const raw = await readFile('data/cfb_schedule.json', 'utf-8')
		const schedule: CfbScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			schedule.events.flatMap((e) =>
				e.competitions[0].competitors.map((c) => c.team)
			),
			'id'
		).map(cfbTeamToTeam)
	}

	return orderBy(teams, 'fullName')
}
