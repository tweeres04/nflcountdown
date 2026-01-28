import { useEffect, useState } from 'react'
import { Link } from '@remix-run/react'
import { Game } from '~/lib/types'
import { differenceInMilliseconds } from 'date-fns'

interface YouMightLikeProps {
	games: Game[] // Pre-filtered games from server
	league: string
}

// Mini countdown component with "in 2h 15m" format
function MiniCountdown({ gameTime }: { gameTime: string }) {
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
					setTimeString('In progress')
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

export default function YouMightLike({ games, league }: YouMightLikeProps) {
	const lowercaseLeague = league.toLowerCase()

	// Don't render if no games found (already filtered server-side)
	if (games.length === 0) return null

	return (
		<div className="mt-8 lg:max-w-[500px] mx-auto">
			<h3 className="text-xl mb-4">You might like</h3>
			<div className="space-y-3">
				{games.map((game) => {
					const homeAbbrev = game.homeTeam!.abbreviation.toLowerCase()
					const awayAbbrev = game.awayTeam!.abbreviation.toLowerCase()

					return (
						<div key={game.id} className="space-y-1">
							<div className="text-sm">
								<Link
									to={`/${lowercaseLeague}/${homeAbbrev}`}
									className="content-link"
								>
									{game.homeTeam!.fullName}
								</Link>
								{' vs '}
								<Link
									to={`/${lowercaseLeague}/${awayAbbrev}`}
									className="content-link"
								>
									{game.awayTeam!.fullName}
								</Link>
							</div>
							<MiniCountdown gameTime={game.time!} />
						</div>
					)
				})}
			</div>
		</div>
	)
}
