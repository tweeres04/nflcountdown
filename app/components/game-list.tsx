import { Link, useParams } from '@remix-run/react'
import { Game, Team } from '~/lib/types'
import { getGameSlug } from '~/lib/getGameSlug'

interface GameListProps {
	games: Game[]
	team: Team
}

export default function GameList({ games, team }: GameListProps) {
	const { league } = useParams()
	const futureGames = games.filter(
		(g) => g.time && new Date(g.time) > new Date()
	)

	return (
		<ul className="space-y-5 mt-8">
			{futureGames.map((g, i) => {
				const gameSlug = getGameSlug(g, team.abbreviation)
				const opponent =
					g.homeTeam?.abbreviation === team.abbreviation
						? g.awayTeam
						: g.homeTeam

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
						{opponent ? (
							<>
								{g.homeTeam?.abbreviation === team.abbreviation ? 'vs' : 'at'}{' '}
								{opponent.fullName}
							</>
						) : null}
					</>
				)

				return (
					<li key={g.id}>
						{gameSlug ? (
							<Link
								to={
									i === 0
										? `/${league}/${team.abbreviation.toLowerCase()}` // Show the next game view if it's the next game
										: `/${league}/${team.abbreviation.toLowerCase()}/${gameSlug}`
								}
								className="hover:text-white/80 transition-colors"
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
