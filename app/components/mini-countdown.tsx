import { useEffect, useState } from 'react'
import { differenceInMilliseconds } from 'date-fns'

interface MiniCountdownProps {
	gameTime: string
}

// Mini countdown component with "in 2h 15m" format
export default function MiniCountdown({ gameTime }: MiniCountdownProps) {
	const [timeString, setTimeString] = useState<string>('')

	useEffect(() => {
		const updateCountdown = () => {
			const now = new Date()
			const gameDate = new Date(gameTime)
			const diff = differenceInMilliseconds(gameDate, now)

			// Game has started (check if within game duration)
			if (diff <= 0) {
				const gameDuration = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
				const timeSinceStart = Math.abs(diff)
				if (timeSinceStart < gameDuration) {
					setTimeString('Live!')
				} else {
					setTimeString('Completed')
				}
				return
			}

			// Game hasn't started yet
			const totalMinutes = Math.floor(diff / 60000)
			const days = Math.floor(totalMinutes / (60 * 24))
			const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
			const minutes = totalMinutes % 60

			if (days > 0) {
				setTimeString(`in ${days}d ${hours}h ${minutes}m`)
			} else if (hours > 0) {
				setTimeString(`in ${hours}h ${minutes}m`)
			} else {
				setTimeString(`in ${minutes}m`)
			}
		}

		updateCountdown()
		const interval = setInterval(updateCountdown, 30000) // Update every 30 seconds

		return () => clearInterval(interval)
	}, [gameTime])

	return <div className="text-sm">{timeString}</div>
}
