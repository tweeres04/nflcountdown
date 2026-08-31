import { useEffect, useState } from 'react'
import {
	add,
	differenceInDays,
	differenceInMilliseconds,
	differenceInMonths,
} from 'date-fns'

interface MiniCountdownProps {
	gameTime: string
}

const GAME_DURATION_MS = 3 * 60 * 60 * 1000

/**
 * Compact countdown: "in 2h 15m" up close, "in 3y 9mo 11d" for a World Cup.
 *
 * Shows the three most significant units starting from the largest non-zero
 * one, then drops any zero among them — "in 9mo 23d", not "in 9mo 23d 0h".
 */
export function miniCountdownString(now: Date, gameDate: Date) {
	const diff = differenceInMilliseconds(gameDate, now)

	if (diff <= 0) {
		return Math.abs(diff) < GAME_DURATION_MS ? 'Live!' : 'Completed'
	}

	// Months and years vary in length, so peel each unit off the clock in turn
	// rather than dividing a millisecond total by an average month.
	//
	// Years are split out of the month total rather than measured separately:
	// differenceInYears won't count a year from Feb 29 until Mar 1, so pairing
	// it with differenceInMonths renders Feb 29 2028 -> Feb 28 2030 as
	// "1y 12mo", which reads as two years.
	const totalMonths = differenceInMonths(gameDate, now)
	const years = Math.floor(totalMonths / 12)
	const months = totalMonths % 12
	const afterMonths = add(now, { months: totalMonths })
	const days = differenceInDays(gameDate, afterMonths)
	const afterDays = add(afterMonths, { days })

	const remainingMs = differenceInMilliseconds(gameDate, afterDays)
	const hours = Math.floor(remainingMs / (60 * 60 * 1000))
	const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / 60000)

	const units = [
		{ value: years, label: 'y' },
		{ value: months, label: 'mo' },
		{ value: days, label: 'd' },
		{ value: hours, label: 'h' },
		{ value: minutes, label: 'm' },
	]

	const largest = units.findIndex((u) => u.value > 0)

	// Under a minute out, every unit is zero and there's nothing left to print.
	if (largest === -1) {
		return 'Starting soon'
	}

	const shown = units.slice(largest, largest + 3).filter((u) => u.value > 0)

	return `in ${shown.map((u) => `${u.value}${u.label}`).join(' ')}`
}

export default function MiniCountdown({ gameTime }: MiniCountdownProps) {
	const [timeString, setTimeString] = useState<string>('')

	useEffect(() => {
		const updateCountdown = () => {
			setTimeString(miniCountdownString(new Date(), new Date(gameTime)))
		}

		updateCountdown()
		const interval = setInterval(updateCountdown, 30000) // Update every 30 seconds

		return () => clearInterval(interval)
	}, [gameTime])

	return <div className="text-sm">{timeString}</div>
}
