import { readFile } from 'node:fs/promises'
import { mlbGameToGame } from './mlbGameToGame'
import { nbaGameToGame } from './nbaGameToGame'
import { nflGameToGame } from './nflGameToGame'
import { nhlGameToGame } from './nhlGameToGame'
import { MlbScheduleApi, NbaScheduleApi, NflScheduleApi, NhlScheduleApi, Game } from './types'

/**
 * Loads all games for a given league from JSON schedule files.
 * Handles league-specific filtering and transformations.
 */
export async function getAllGames(league: string): Promise<Game[]> {
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
			.map(nbaGameToGame)
	}

	if (LEAGUE === 'NFL') {
		const raw = await readFile('data/nfl_schedule.json', 'utf-8')
		const nflSchedule: NflScheduleApi = JSON.parse(raw)
		return nflSchedule.games.map(nflGameToGame)
	}

	if (LEAGUE === 'NHL') {
		const raw = await readFile('data/nhl_schedule.json', 'utf-8')
		const nhlSchedule: NhlScheduleApi = JSON.parse(raw)
		return nhlSchedule.games.map(nhlGameToGame)
	}

	return []
}
