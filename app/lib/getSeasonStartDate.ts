import {
	addDays,
	getYear,
	nextMonday,
	nextTuesday,
	nextFriday,
	nextSaturday,
	startOfMonth,
	isFuture,
	isMonday,
	isTuesday,
	isFriday,
	isSaturday,
} from 'date-fns'
import { getAllGames } from './getAllGames'

export interface SeasonStartResult {
	date: Date
	isMidSeason: boolean
}

/**
 * Returns a date set to the Nth weekday of the given month/year.
 * e.g. nthWeekdayOf(2026, 9, isTuesday, nextTuesday, 4) = 4th Tuesday of October 2026
 */
function nthWeekdayOfMonth(
	year: number,
	month: number, // 0-indexed (0 = Jan, 8 = Sep, 9 = Oct)
	isWeekday: (d: Date) => boolean,
	nextWeekday: (d: Date) => Date,
	n: number
): Date {
	const firstDay = new Date(year, month, 1)
	// Find first occurrence of the weekday in this month
	const first = isWeekday(firstDay) ? firstDay : nextWeekday(firstDay)
	// Add (n-1) weeks
	return addDays(first, (n - 1) * 7)
}

/**
 * Returns the last occurrence of a weekday in a given month/year.
 */
function lastWeekdayOfMonth(
	year: number,
	month: number, // 0-indexed
	isWeekday: (d: Date) => boolean,
	nextWeekday: (d: Date) => Date
): Date {
	// Start from first of next month, go back to find last occurrence
	const firstOfNextMonth = new Date(year, month + 1, 1)
	// Last day of month
	const lastDay = addDays(firstOfNextMonth, -1)
	// Walk back to find the weekday
	let d = lastDay
	while (!isWeekday(d)) {
		d = addDays(d, -1)
	}
	return d
}

/**
 * Calculates the approximate season start date for a given league and year.
 * These are rule-based approximations for the offseason gap when no schedule is available.
 *
 * Rules (researched from historical data):
 *   NFL  - Thursday after Labor Day (first Monday of September) — exact league rule
 *   MLB  - Last Thursday of March — consistent since 2018 (Opening Day)
 *   NBA  - 4th Tuesday of October
 *   NHL  - 1st Tuesday of October
 *   WNBA - 3rd Friday of May
 *   MLS  - Last Saturday of February
 *   CPL  - 2nd Saturday of April
 */
function calculateSeasonStartDate(league: string, year: number): Date {
	const LEAGUE = league.toUpperCase()

	let date: Date

	if (LEAGUE === 'NFL') {
		// Thursday after Labor Day (first Monday of September)
		const firstDayOfSeptember = new Date(year, 8, 1)
		const laborDay = isMonday(firstDayOfSeptember)
			? firstDayOfSeptember
			: nextMonday(startOfMonth(firstDayOfSeptember))
		date = addDays(laborDay, 3) // Thursday
		date.setUTCHours(24, 15, 0, 0) // 8:15 PM EDT
		return date
	}

	if (LEAGUE === 'MLB') {
		// Last Thursday of March
		date = lastWeekdayOfMonth(
			year,
			2,
			(d) => d.getDay() === 4,
			(d) => {
				// nextThursday — date-fns doesn't export it directly, so compute manually
				const diff = (4 - d.getDay() + 7) % 7 || 7
				return addDays(d, diff)
			}
		)
		date.setUTCHours(17, 0, 0, 0) // 1:00 PM EDT (UTC-4) = 17:00 UTC
		return date
	}

	if (LEAGUE === 'NBA') {
		// 4th Tuesday of October
		date = nthWeekdayOfMonth(year, 9, isTuesday, nextTuesday, 4)
		date.setUTCHours(23, 30, 0, 0) // 7:30 PM EDT (UTC-4) = 23:30 UTC
		return date
	}

	if (LEAGUE === 'NHL') {
		// 1st Tuesday of October
		date = nthWeekdayOfMonth(year, 9, isTuesday, nextTuesday, 1)
		date.setUTCHours(23, 0, 0, 0) // 7:00 PM EDT (UTC-4) = 23:00 UTC
		return date
	}

	if (LEAGUE === 'WNBA') {
		// 3rd Friday of May
		date = nthWeekdayOfMonth(year, 4, isFriday, nextFriday, 3)
		date.setUTCHours(23, 30, 0, 0) // 7:30 PM EDT (UTC-4) = 23:30 UTC
		return date
	}

	if (LEAGUE === 'MLS') {
		// Last Saturday of February
		date = lastWeekdayOfMonth(year, 1, isSaturday, nextSaturday)
		date.setUTCHours(18, 0, 0, 0) // 1:00 PM EST (UTC-5) = 18:00 UTC
		return date
	}

	if (LEAGUE === 'CPL') {
		// 2nd Saturday of April
		date = nthWeekdayOfMonth(year, 3, isSaturday, nextSaturday, 2)
		date.setUTCHours(19, 0, 0, 0) // 3:00 PM EDT (UTC-4) = 19:00 UTC
		return date
	}

	// Fallback: first day of next year
	return new Date(year + 1, 0, 1)
}

/**
 * Returns the season start date and mid-season status for a given league.
 *
 * Strategy:
 * 1. Load the schedule and check if the season is currently underway
 *    (has both past and future games). If so, return isMidSeason: true
 *    and a calculated next-season date (available for future "next season"
 *    countdown UI if desired).
 * 2. If not mid-season and there are future games, use the earliest one
 *    as the season start date.
 * 3. Otherwise, fall back to calculated approximation rules per league.
 *    If the calculated date has already passed, advance to next year.
 */
export async function getSeasonStartDate(
	league: string
): Promise<SeasonStartResult> {
	const now = new Date()

	try {
		const games = await getAllGames(league)
		const hasPastGames = games.some((g) => g.time && new Date(g.time) < now)
		const futureGames = games
			.filter((g) => g.time && new Date(g.time) > now)
			.sort((a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime())
		const hasFutureGames = futureGames.length > 0

		if (hasPastGames && hasFutureGames) {
			// Mid-season: calculate next season's start date for future use
			const currentYear = getYear(now)
			const nextSeasonDate = calculateSeasonStartDate(league, currentYear + 1)
			return { date: nextSeasonDate, isMidSeason: true }
		}

		if (hasFutureGames && futureGames[0].time) {
			return { date: new Date(futureGames[0].time), isMidSeason: false }
		}
	} catch {
		// Schedule file missing or malformed — fall through to calculated date
	}

	// Fall back to calculated approximation
	const currentYear = getYear(now)
	let date = calculateSeasonStartDate(league, currentYear)

	// If the calculated date has already passed, try next year
	if (!isFuture(date)) {
		date = calculateSeasonStartDate(league, currentYear + 1)
	}

	return { date, isMidSeason: false }
}
