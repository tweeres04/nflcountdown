import { describe, it, expect } from 'vitest'
import { getLastChangeTimes, IN_PROGRESS_MS } from './sitemap-lastmod'
import type { Game, Team } from './types'

const sea: Team = {
	id: 1,
	fullName: 'Seattle Sounders',
	nickName: 'Sounders',
	abbreviation: 'SEA',
	primaryColor: '#005595',
	secondaryColor: '#5D9741',
}

const lafc: Team = {
	id: 2,
	fullName: 'Los Angeles FC',
	nickName: 'LAFC',
	abbreviation: 'LAFC',
	primaryColor: '#000000',
	secondaryColor: '#C39E6D',
}

const NOW = Date.parse('2026-05-27T21:00:00Z')

function game(time: string | null, homeTeam: Team | null, awayTeam: Team | null): Game {
	return { id: `g-${time}`, time, homeTeam, awayTeam, startTimeTbd: null }
}

describe('getLastChangeTimes', () => {
	it('records the roll-over (start + 3h) for a fully completed game', () => {
		// Kickoff 3.5h before now -> rolled over 0.5h ago
		const start = NOW - 3.5 * 60 * 60 * 1000
		const { byTeam, leagueMax } = getLastChangeTimes(
			[game(new Date(start).toISOString(), sea, lafc)],
			NOW
		)
		const expected = start + IN_PROGRESS_MS
		expect(byTeam.get('sea')).toBe(expected)
		expect(byTeam.get('lafc')).toBe(expected)
		expect(leagueMax).toBe(expected)
	})

	it('credits both home and away teams', () => {
		const start = NOW - 4 * 60 * 60 * 1000
		const { byTeam } = getLastChangeTimes(
			[game(new Date(start).toISOString(), sea, lafc)],
			NOW
		)
		expect(byTeam.has('sea')).toBe(true)
		expect(byTeam.has('lafc')).toBe(true)
	})

	it('excludes an in-progress game (started, not yet rolled over)', () => {
		// Kickoff 1h before now -> still "in progress", rolls over in 2h
		const start = NOW - 1 * 60 * 60 * 1000
		const { byTeam, leagueMax } = getLastChangeTimes(
			[game(new Date(start).toISOString(), sea, lafc)],
			NOW
		)
		expect(byTeam.size).toBe(0)
		expect(leagueMax).toBeNull()
	})

	it('excludes a future game', () => {
		const start = NOW + 24 * 60 * 60 * 1000
		const { byTeam, leagueMax } = getLastChangeTimes(
			[game(new Date(start).toISOString(), sea, lafc)],
			NOW
		)
		expect(byTeam.size).toBe(0)
		expect(leagueMax).toBeNull()
	})

	it('takes the most recent roll-over per team across multiple games', () => {
		const older = NOW - 10 * 24 * 60 * 60 * 1000
		const recent = NOW - 5 * 60 * 60 * 1000
		const { byTeam } = getLastChangeTimes(
			[
				game(new Date(older).toISOString(), sea, lafc),
				game(new Date(recent).toISOString(), lafc, sea),
			],
			NOW
		)
		expect(byTeam.get('sea')).toBe(recent + IN_PROGRESS_MS)
		expect(byTeam.get('lafc')).toBe(recent + IN_PROGRESS_MS)
	})

	it('skips games with no time and null teams', () => {
		const start = NOW - 4 * 60 * 60 * 1000
		const { byTeam, leagueMax } = getLastChangeTimes(
			[
				game(null, sea, lafc),
				game(new Date(start).toISOString(), sea, null),
			],
			NOW
		)
		// Only the timed game's home team is recorded; null away team is skipped
		expect(byTeam.get('sea')).toBe(start + IN_PROGRESS_MS)
		expect(byTeam.size).toBe(1)
		expect(leagueMax).toBe(start + IN_PROGRESS_MS)
	})

	it('returns null leagueMax when no games have rolled over', () => {
		const { byTeam, leagueMax } = getLastChangeTimes([], NOW)
		expect(byTeam.size).toBe(0)
		expect(leagueMax).toBeNull()
	})
})
