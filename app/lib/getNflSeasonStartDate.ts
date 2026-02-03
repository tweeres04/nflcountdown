import {
	addDays,
	getYear,
	nextMonday,
	startOfMonth,
	isFuture,
	isMonday,
} from 'date-fns'

/**
 * Calculates the start date of the next NFL season.
 * NFL season starts on the Thursday following Labor Day (first Monday of September).
 * If that date has already passed, returns next year's start date.
 */
export function getNflSeasonStartDate(): Date {
	const today = new Date()
	const currentYear = getYear(today)

	const firstDayOfSeptember = new Date(currentYear, 8, 1)

	// First Monday of September in currentYear (Labor day in USA)
	const firstMondayOfSeptember = isMonday(firstDayOfSeptember)
		? firstDayOfSeptember
		: nextMonday(startOfMonth(firstDayOfSeptember))

	// Weekend following the first Monday (Thursday)
	let seasonStartDate = addDays(firstMondayOfSeptember, 3)

	// If this date has already passed, use next year
	if (!isFuture(seasonStartDate)) {
		const firstDayOfSeptemberNextYear = new Date(currentYear + 1, 8, 1)
		seasonStartDate = isMonday(firstDayOfSeptemberNextYear)
			? firstDayOfSeptemberNextYear
			: nextMonday(startOfMonth(firstDayOfSeptemberNextYear))
		seasonStartDate = addDays(seasonStartDate, 3)
	}

	// Set time to 8:15 PM EDT (UTC-4)
	seasonStartDate.setUTCHours(20 + 4, 15, 0, 0) // Adding 4 hours to convert from EDT to UTC
	return seasonStartDate
}
