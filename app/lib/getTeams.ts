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
import { worldCupTeamToTeam } from './worldCupGameToGame'
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
	WorldCupScheduleApi,
	WorldCupTeamApi,
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
	} else if (LEAGUE === 'WORLDCUP') {
		const raw = await readFile('data/worldcup_schedule.json', 'utf-8')
		const schedule: WorldCupScheduleApi = JSON.parse(raw)
		teams = uniqBy(
			schedule.Results.flatMap((m) => [m.Home, m.Away]).filter(
				(t): t is WorldCupTeamApi => t !== null && !!t.IdTeam
			),
			'IdTeam'
		)
			.map(worldCupTeamToTeam)
			.filter((t): t is Team => t !== null)
	}

	return orderBy(teams, 'fullName')
}

export type SidebarTeam = { abbreviation: string; fullName: string }
export type TeamsByLeague = Record<string, SidebarTeam[]>

// Leagues shown in the nav (World Cup has no team list, so it ends up empty).
const NAV_LEAGUES = [
	'NFL',
	'CFB',
	'MLB',
	'NBA',
	'WNBA',
	'NHL',
	'MLS',
	'NWSL',
	'PWHL',
	'WORLDCUP',
]

let allTeamsCache: { value: TeamsByLeague; expires: number } | null = null
const ALL_TEAMS_TTL_MS = 60 * 60 * 1000 // 1 hour

// Every nav league's teams (minimal fields) for the sidebar. Memoized so the
// ~10 schedule-file reads happen at most once an hour rather than per request.
export async function getAllTeamsByLeague(): Promise<TeamsByLeague> {
	if (allTeamsCache && allTeamsCache.expires > Date.now()) {
		return allTeamsCache.value
	}

	const entries = await Promise.all(
		NAV_LEAGUES.map(async (league) => {
			try {
				const teams = await getTeams(league)
				return [
					league,
					teams.map((t) => ({
						abbreviation: t.abbreviation,
						fullName: t.fullName,
					})),
				] as const
			} catch (error) {
				// One league's missing/invalid schedule file shouldn't break the
				// nav on every page — log it and omit its teams.
				// TODO: report to Sentry once it's set up in this project.
				console.error(`Failed to load teams for ${league}:`, error)
				return [league, [] as SidebarTeam[]] as const
			}
		})
	)

	const value = Object.fromEntries(entries) as TeamsByLeague
	allTeamsCache = { value, expires: Date.now() + ALL_TEAMS_TTL_MS }
	return value
}
