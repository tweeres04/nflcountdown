import type { Game } from './types'

// The countdown shows "Game in progress!" for 3 hours after kickoff, then rolls
// to the next game — see addHours(time, 3) in countdown.tsx.
export const IN_PROGRESS_MS = 3 * 60 * 60 * 1000

// A page's indexable content (the featured game / countdown) changes when it
// rolls from one game to the next, i.e. 3 hours after a game kicks off. lastmod
// is the most recent of those roll-overs — not the file mtime (our daily
// re-fetch would make that dishonest) and not the live on-screen tick.
export function getLastChangeTimes(games: Game[], now: number) {
	const byTeam = new Map<string, number>()
	let leagueMax = 0
	for (const game of games) {
		if (!game.time) continue
		const start = Date.parse(game.time)
		if (Number.isNaN(start)) continue
		const rolledToNext = start + IN_PROGRESS_MS
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
