import { Link } from '@remix-run/react'
import { Game } from '~/lib/types'
import MiniCountdown from './mini-countdown'

interface YouMightLikeProps {
	games: Game[] // Pre-filtered games from server
	league: string
	title?: string
}

export default function YouMightLike({ games, league, title = 'You might like' }: YouMightLikeProps) {
	const lowercaseLeague = league.toLowerCase()

	// Don't render if no games found (already filtered server-side)
	if (games.length === 0) return null

	return (
		<div id="upcoming-games" className="mt-10 lg:max-w-[500px] mx-auto">
			<h3 className="text-xl mb-4">{title}</h3>
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
