import { Link } from '@remix-run/react'
import { Game, Team } from '~/lib/types'
import { getGameSlug } from '~/lib/getGameSlug'

interface GameListProps {
	games: Game[]
	team: Team
}

export default function GameList({ games, team }: GameListProps) {
	return (
		<ul className="space-y-5 mt-8">
			{games.map((g, i) => {
				const gameSlug = getGameSlug(g, team.abbreviation)

				const linkContent = (
					<>
						<div className="font-bold text-lg">
							{g.time
								? new Intl.DateTimeFormat('en-US', {
										dateStyle: 'full',
										timeStyle: 'short',
								  }).format(new Date(g.time))
								: 'TBD'}
						</div>
						{g.homeTeam.abbreviation === team.abbreviation ? 'vs' : 'at'}{' '}
						{g.homeTeam.abbreviation !== team.abbreviation
							? g.homeTeam.fullName
							: g.awayTeam.fullName}
					</>
				)

				return (
					<li key={g.id}>
						{gameSlug ? (
							<Link
								to={
									i === 0
										? `/${team.abbreviation.toLowerCase()}` // Show the next game view if it's the next game
										: `/${team.abbreviation.toLowerCase()}/${gameSlug}`
								}
								className="hover:text-white/80"
							>
								{linkContent}
							</Link>
						) : (
							linkContent
						)}
					</li>
				)
			})}
		</ul>
	)
}
