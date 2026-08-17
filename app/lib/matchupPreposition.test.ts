import { describe, it, expect } from 'vitest'
import { matchupPreposition } from './matchupPreposition'
import type { Game, Team } from './types'

function team(abbreviation: string): Team {
	return {
		id: abbreviation,
		nickName: abbreviation,
		fullName: abbreviation,
		abbreviation,
		primaryColor: '#000',
		secondaryColor: '#fff',
	}
}

function game(overrides: Partial<Game> = {}): Game {
	return {
		id: '1',
		time: '2026-09-10T00:20:00Z',
		homeTeam: team('SEA'),
		awayTeam: team('NE'),
		startTimeTbd: false,
		...overrides,
	}
}

describe('matchupPreposition', () => {
	it('says "vs" for the home team', () => {
		expect(matchupPreposition(game(), 'SEA')).toBe('vs')
	})

	it('says "at" for the away team', () => {
		expect(matchupPreposition(game(), 'NE')).toBe('at')
	})

	it('says "vs" for both sides of a neutral-site game', () => {
		const melbourne = game({ neutralSite: true })

		expect(matchupPreposition(melbourne, 'SEA')).toBe('vs')
		expect(matchupPreposition(melbourne, 'NE')).toBe('vs')
	})

	it('treats an unknown neutral flag as a normal home/away game', () => {
		expect(matchupPreposition(game({ neutralSite: null }), 'NE')).toBe('at')
	})
})
