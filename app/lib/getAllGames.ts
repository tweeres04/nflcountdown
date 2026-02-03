import { readFile } from 'node:fs/promises'
import { mlbGameToGame } from './mlbGameToGame'
import { nbaGameToGame } from './nbaGameToGame'
import { nflGameToGame } from './nflGameToGame'
import { nhlGameToGame } from './nhlGameToGame'
import { wnbaGameToGame } from './wnbaGameToGame'
import { MlbScheduleApi, NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, Game } from './types'

/**
 * Loads all games for a given league from JSON schedule files.
 * Handles league-specific filtering and transformations.
 * @param league - League identifier (e.g., 'NFL', 'NBA', 'NHL', 'MLB')
 * @param viewingTeamAbbrev - Optional team abbreviation for the team page being viewed.
 *                            Currently only used by NHL to order broadcast networks appropriately
 *                            (Canadian networks first for Canadian teams, US networks first for US teams).
 */
export async function getAllGames(league: string, viewingTeamAbbrev?: string): Promise<Game[]> {
	const LEAGUE = league.toUpperCase()

	if (LEAGUE === 'MLB') {
		const raw = await readFile('data/mlb_schedule.json', 'utf-8')
		const mlbSchedule: MlbScheduleApi = JSON.parse(raw)
		return mlbSchedule.dates.flatMap((d) => d.games).map(mlbGameToGame)
	}

	if (LEAGUE === 'NBA') {
		const raw = await readFile('data/nba_schedule.json', 'utf-8')
		const nbaSchedule: NbaScheduleApi = JSON.parse(raw)
		return nbaSchedule.leagueSchedule.gameDates
			.flatMap((gd) => gd.games)
			.filter((g) => g.homeTeam.teamId > 0)
			.filter((g) => g.gameLabel !== 'Preseason')
			.map(g => nbaGameToGame(g, viewingTeamAbbrev))
	}

	if (LEAGUE === 'NFL') {
		const raw = await readFile('data/nfl_schedule.json', 'utf-8')
		const nflSchedule: NflScheduleApi = JSON.parse(raw)
		return nflSchedule.games.map(nflGameToGame)
	}

	if (LEAGUE === 'NHL') {
		const raw = await readFile('data/nhl_schedule.json', 'utf-8')
		const nhlSchedule: NhlScheduleApi = JSON.parse(raw)
		return nhlSchedule.games.map(g => nhlGameToGame(g, viewingTeamAbbrev))
	}

	if (LEAGUE === 'WNBA') {
		const raw = await readFile('data/wnba_schedule.json', 'utf-8')
		const wnbaSchedule: WnbaScheduleApi = JSON.parse(raw)
		return wnbaSchedule.leagueSchedule.gameDates
			.flatMap((gd) => gd.games)
			.filter((g) => g.homeTeam.teamId > 0)
			.map(g => wnbaGameToGame(g, viewingTeamAbbrev))
	}

	return []
}
