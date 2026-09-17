import React from 'react'
import { Link } from '@remix-run/react'
import { Game } from '~/lib/types'
import { teamLogo } from '~/lib/leagues'
import { cn } from '~/lib/utils'
import Logo from './logo'

// "[logo] Home Team vs [logo] Away Team", each team linking to its page.
// Home team first to match "vs". Wraps on narrow screens.
export default function Matchup({
	game,
	league,
	className,
}: {
	game: Game
	league: string
	className?: string
}) {
	const lowercaseLeague = league.toLowerCase()
	const teams = [game.homeTeam!, game.awayTeam!]

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-x-2 gap-y-1 text-sm',
				className
			)}
		>
			{teams.map((t, i) => {
				const abbrev = t.abbreviation.toLowerCase()
				return (
					<React.Fragment key={abbrev}>
						{i > 0 && <span className="text-white/60">vs</span>}
						<Link
							to={`/${lowercaseLeague}/${abbrev}`}
							className="content-link flex items-center gap-1"
						>
							<Logo
								src={teamLogo(league, abbrev)}
								fallbackSrc={`/logos/${lowercaseLeague}.svg`}
								className="size-6"
							/>
							{t.fullName}
						</Link>
					</React.Fragment>
				)
			})}
		</div>
	)
}
