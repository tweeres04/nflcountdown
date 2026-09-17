import { Game } from '~/lib/types'
import MiniCountdown from './mini-countdown'
import Matchup from './matchup'

interface YouMightLikeProps {
	games: Game[] // Pre-filtered games from server
	league: string
	title?: string
}

export default function YouMightLike({ games, league, title = 'You might like' }: YouMightLikeProps) {
	// Don't render if no games found (already filtered server-side)
	if (games.length === 0) return null

	return (
		<div id="upcoming-games" className="mt-10 lg:max-w-[500px] mx-auto">
			<h3 className="text-xl mb-4">{title}</h3>
			<div className="space-y-3">
				{games.map((game) => (
					<div key={game.id} className="space-y-1">
						<Matchup game={game} league={league} />
						{/* pl-7 = logo (24px) + gap (4px): lines up with the home team name */}
						<MiniCountdown gameTime={game.time!} className="pl-7" />
					</div>
				))}
			</div>
		</div>
	)
}
