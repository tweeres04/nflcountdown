import { describe, it, expect, vi } from 'vitest'
import {
	generateTitle,
	generateDescription,
	generateTeamFaqSchema,
	BIG_LEAGUES,
} from './generateMeta'
import type { Game, Team } from './types'

const seahawks: Team = {
	id: 1,
	fullName: 'Seattle Seahawks',
	nickName: 'Seahawks',
	abbreviation: 'SEA',
	primaryColor: '#002244',
	secondaryColor: '#69BE28',
}

const cardinals: Team = {
	id: 2,
	fullName: 'Arizona Cardinals',
	nickName: 'Cardinals',
	abbreviation: 'ARI',
	primaryColor: '#97233F',
	secondaryColor: '#000000',
}

const frost: Team = {
	id: 3,
	fullName: 'Minnesota Frost',
	nickName: 'Frost',
	abbreviation: 'MIN',
	primaryColor: '#236192',
	secondaryColor: '#FFFFFF',
}

const nextGame: Game = {
	id: 'game-1',
	time: '2026-09-09T00:20:00Z',
	homeTeam: seahawks,
	awayTeam: cardinals,
	startTimeTbd: false,
	broadcast: 'NBC',
}

const tbdGame: Game = {
	id: 'game-2',
	time: '2026-09-15T00:00:00Z',
	homeTeam: seahawks,
	awayTeam: cardinals,
	startTimeTbd: true,
	broadcast: null,
}

describe('generateTitle', () => {
	it('generates game page title with opponent and date', () => {
		const title = generateTitle(seahawks, 'NFL', '2026', nextGame)
		expect(title).toContain('Seattle Seahawks vs Arizona Cardinals')
		expect(title).toContain('2026')
		expect(title).toContain('Team Countdown')
	})

	it('generates big league team page title with countdown focus', () => {
		const title = generateTitle(seahawks, 'NFL', '2026')
		expect(title).toBe(
			'Seattle Seahawks Countdown - 2026 Schedule & Next Game'
		)
	})

	it('generates small league team page title with next game focus', () => {
		const title = generateTitle(frost, 'PWHL', '2026')
		expect(title).toBe(
			'When is the Next Minnesota Frost Game? - PWHL Countdown 2026'
		)
	})

	it('includes year in both big and small league titles', () => {
		const big = generateTitle(seahawks, 'NFL', '2027')
		const small = generateTitle(frost, 'PWHL', '2027')
		expect(big).toContain('2027')
		expect(small).toContain('2027')
	})
})

describe('generateDescription', () => {
	it('generates game page description with opponent and date', () => {
		const desc = generateDescription(seahawks, 'NFL', nextGame)
		expect(desc).toContain('Seattle Seahawks vs Arizona Cardinals')
		expect(desc).toContain('home screen')
	})

	it('generates team page description with next game info', () => {
		const desc = generateDescription(seahawks, 'NFL', undefined, nextGame)
		expect(desc).toContain('Live countdown')
		expect(desc).toContain('Arizona Cardinals')
		expect(desc).toContain('home screen')
	})

	it('generates team page description without next game', () => {
		const desc = generateDescription(seahawks, 'NFL')
		expect(desc).toContain('Live countdown')
		expect(desc).toContain('Seattle Seahawks')
		expect(desc).not.toContain('undefined')
	})
})

describe('generateTeamFaqSchema', () => {
	it('includes next game question with opponent and date', () => {
		const schema = generateTeamFaqSchema(seahawks, nextGame) as any
		expect(schema['@type']).toBe('FAQPage')
		expect(schema['@context']).toBe('https://schema.org')

		const nextGameQ = schema.mainEntity.find(
			(q: any) => q.name === 'When is the next Seattle Seahawks game?'
		)
		expect(nextGameQ).toBeDefined()
		expect(nextGameQ.acceptedAnswer.text).toContain('Arizona Cardinals')
	})

	it('includes broadcast question when available', () => {
		const schema = generateTeamFaqSchema(seahawks, nextGame) as any
		const broadcastQ = schema.mainEntity.find(
			(q: any) =>
				q.name === 'What channel is the Seattle Seahawks game on?'
		)
		expect(broadcastQ).toBeDefined()
		expect(broadcastQ.acceptedAnswer.text).toContain('NBC')
	})

	it('omits broadcast question when not available', () => {
		const schema = generateTeamFaqSchema(seahawks, tbdGame) as any
		const broadcastQ = schema.mainEntity.find(
			(q: any) =>
				q.name === 'What channel is the Seattle Seahawks game on?'
		)
		expect(broadcastQ).toBeUndefined()
	})

	it('includes countdown question', () => {
		const schema = generateTeamFaqSchema(seahawks, nextGame) as any
		const countdownQ = schema.mainEntity.find(
			(q: any) =>
				q.name ===
				'How many days until the next Seattle Seahawks game?'
		)
		expect(countdownQ).toBeDefined()
		expect(countdownQ.acceptedAnswer.text).toContain('live countdown')
	})

	it('handles no next game gracefully', () => {
		const schema = generateTeamFaqSchema(seahawks) as any
		const nextGameQ = schema.mainEntity.find(
			(q: any) => q.name === 'When is the next Seattle Seahawks game?'
		)
		expect(nextGameQ.acceptedAnswer.text).toContain(
			'schedule has not been announced'
		)
	})
})

describe('BIG_LEAGUES', () => {
	it('includes major leagues', () => {
		expect(BIG_LEAGUES.has('NFL')).toBe(true)
		expect(BIG_LEAGUES.has('MLB')).toBe(true)
		expect(BIG_LEAGUES.has('NBA')).toBe(true)
		expect(BIG_LEAGUES.has('NHL')).toBe(true)
	})

	it('excludes small leagues', () => {
		expect(BIG_LEAGUES.has('PWHL')).toBe(false)
		expect(BIG_LEAGUES.has('NWSL')).toBe(false)
		expect(BIG_LEAGUES.has('CPL')).toBe(false)
	})
})
