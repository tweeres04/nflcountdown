import { describe, it, expect } from 'vitest'
import { add, type Duration } from 'date-fns'
import { miniCountdownString } from './mini-countdown'

// Each target is built by adding the same units the assertion names, so the
// decomposition round-trips no matter what timezone the tests run in.
const NOW = new Date('2026-08-31T12:00:00Z')

const at = (duration: Duration) => miniCountdownString(NOW, add(NOW, duration))

describe('miniCountdownString', () => {
	it('shows three units when all three are non-zero', () => {
		expect(at({ days: 28, hours: 21, minutes: 56 })).toBe('in 28d 21h 56m')
	})

	it('reaches for months and years on a long wait', () => {
		expect(at({ years: 3, months: 9, days: 10 })).toBe('in 3y 9mo 10d')
	})

	it('drops a trailing zero instead of padding with 0h', () => {
		expect(at({ months: 9, days: 23 })).toBe('in 9mo 23d')
	})

	it('drops a zero sitting between two units', () => {
		expect(at({ years: 3, days: 11 })).toBe('in 3y 11d')
	})

	it('shows no more than three units', () => {
		expect(at({ years: 3, months: 9, days: 10, hours: 5 })).toBe(
			'in 3y 9mo 10d'
		)
	})

	it('drops the minutes for a game on the hour', () => {
		expect(at({ hours: 2 })).toBe('in 2h')
	})

	// Every unit rounds to zero here, so dropping zeros would otherwise leave
	// nothing to render at all.
	it('still says something under a minute out', () => {
		expect(at({ seconds: 30 })).toBe('Starting soon')
	})

	it('is live from kickoff until three hours after', () => {
		expect(at({ hours: -1 })).toBe('Live!')
	})

	it('is completed once the game window has passed', () => {
		expect(at({ hours: -4 })).toBe('Completed')
	})
})

// The cases above build each target by adding the units they assert, which
// can't surface a pair where the calendar math doesn't invert cleanly. These
// name two real dates instead. Both are constructed in local time (month is
// 0-indexed), so the calendar relationship holds in any timezone.
describe('miniCountdownString calendar decomposition', () => {
	const d = (y: number, m: number, day: number) => new Date(y, m, day, 12)

	it('counts a month from the 31st to the end of a shorter month', () => {
		expect(miniCountdownString(d(2026, 7, 31), d(2026, 8, 30))).toBe('in 1mo')
		expect(miniCountdownString(d(2026, 7, 31), d(2026, 9, 1))).toBe('in 1mo 1d')
	})

	it('breaks a long span into months and days', () => {
		expect(miniCountdownString(d(2026, 7, 31), d(2026, 9, 21))).toBe(
			'in 1mo 21d'
		)
	})

	// differenceInYears won't count a year from Feb 29 until Mar 1, so deriving
	// years separately from months rendered these as "12mo" and "1y 12mo".
	it('never leaves twelve months sitting outside a year', () => {
		expect(miniCountdownString(d(2028, 1, 29), d(2029, 1, 28))).toBe('in 1y')
		expect(miniCountdownString(d(2028, 1, 29), d(2030, 1, 28))).toBe('in 2y')
	})

	it('counts a full year between the same date', () => {
		expect(miniCountdownString(d(2027, 2, 1), d(2028, 2, 1))).toBe('in 1y')
	})
})
