import { Link } from '@remix-run/react'
import { Game } from '~/lib/types'
import MiniCountdown from './mini-countdown'

interface UpcomingGamesProps {
	games: Game[]
	league: string
}

export default function UpcomingGames({ games, league }: UpcomingGamesProps) {
	const lowercaseLeague = league.toLowerCase()

	// Don't render if no games found
	if (games.length === 0) return null

	return (
		<div className="space-y-3">
			<h2 className="text-2xl">Live and upcoming games</h2>
			<div className="space-y-3">
				{games.map((game) => {
					const homeAbbrev = game.homeTeam!.abbreviation.toLowerCase()
					const awayAbbrev = game.awayTeam!.abbreviation.toLowerCase()

					return (
						<div key={game.id} className="space-y-1">
							<div className="text-sm">
								<Link
									to={`/${lowercaseLeague}/${homeAbbrev}`}
									className="content-link stone"
								>
									{game.homeTeam!.fullName}
								</Link>
								{' vs '}
								<Link
									to={`/${lowercaseLeague}/${awayAbbrev}`}
									className="content-link stone"
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
