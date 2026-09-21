import { gameDurationHours } from './schema-helpers'
import type { Game } from './types'

// A page's indexable content (the featured game / countdown) changes when it
// rolls from one game to the next, i.e. once the countdown stops showing "Game
// in progress!" (gameDurationHours after the game kicks off). lastmod
// is the most recent of those roll-overs — not the file mtime (our daily
// re-fetch would make that dishonest) and not the live on-screen tick.
export function getLastChangeTimes(LEAGUE: string, games: Game[], now: number) {
	const inProgressMs = gameDurationHours(LEAGUE) * 60 * 60 * 1000
	const byTeam = new Map<string, number>()
	let leagueMax = 0
	for (const game of games) {
		if (!game.time) continue
		const start = Date.parse(game.time)
		if (Number.isNaN(start)) continue
		const rolledToNext = start + inProgressMs
		if (rolledToNext > now) continue
		if (rolledToNext > leagueMax) leagueMax = rolledToNext
		for (const team of [game.homeTeam, game.awayTeam]) {
			if (!team) continue
			const key = team.abbreviation.toLowerCase()
			if (rolledToNext > (byTeam.get(key) ?? 0)) byTeam.set(key, rolledToNext)
		}
	}
	return { byTeam, leagueMax: leagueMax || null }
}
