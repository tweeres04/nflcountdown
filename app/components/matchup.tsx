import React from 'react'
import { Link } from '@remix-run/react'
import { Game } from '~/lib/types'
import { teamLogo } from '~/lib/leagues'
import { cn } from '~/lib/utils'
import Logo from './logo'

// "[logo] Home Team vs [logo] Away Team", each team linking to its page.
// Home team first to match "vs". On small screens the teams stack, one per
// row with "vs" on its own line between them: most matchups are too long
// for one line there, and a trailing "vs" looked broken. Left-aligned, the
// stacked "vs" is indented past the logo to line up with the team names.
export default function Matchup({
	game,
	league,
	centered = false,
}: {
	game: Game
	league: string
	centered?: boolean
}) {
	const lowercaseLeague = league.toLowerCase()
	const teams = [game.homeTeam!, game.awayTeam!]

	return (
		<div
			className={cn(
				'flex flex-col text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1',
				centered ? 'items-center sm:justify-center' : 'items-start'
			)}
		>
			{teams.map((t, i) => {
				const abbrev = t.abbreviation.toLowerCase()
				return (
					<React.Fragment key={abbrev}>
						{i > 0 && (
							<span
								className={cn(
									'text-white/60 text-sm',
									!centered && 'pl-7 sm:pl-0'
								)}
							>
								vs
							</span>
						)}
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
