import { ReactNode, useContext } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from '~/components/ui/dropdown-menu'
import { Team } from '~/lib/types'
import { LeagueContext } from '~/lib/league-context'

type Props = {
	teams: Team[]
	lowercaseAbbreviation?: string
	children: ReactNode
}

export default function TeamsDropdown({
	teams,
	lowercaseAbbreviation,
	children,
}: Props) {
	const LEAGUE = useContext(LeagueContext)
	const lowercaseLeague = LEAGUE?.toLowerCase()
	const color = lowercaseAbbreviation
		? LEAGUE === 'NFL'
			? lowercaseAbbreviation
			: `${lowercaseLeague}-${lowercaseAbbreviation}`
		: 'stone-900'

	const contentClasses = `text-white bg-${color} hover:bg-${color} hover:text-white border-0 rounded-none`

	return (
		<>
			{/* Hidden navigation for SEO - includes all team and league links */}
			<nav className="sr-only" aria-hidden="true">
				{LEAGUE === 'NFL' && <a href="/nfl/season">2026 NFL Season</a>}
				{teams.map((t) => (
					<a
						key={t.abbreviation}
						href={`/${lowercaseLeague}/${t.abbreviation.toLowerCase()}`}
					>
						{t.fullName}
					</a>
				))}
				{['NFL', 'MLB', 'NBA', 'WNBA', 'NHL', 'MLS'].map((league) =>
					LEAGUE !== league ? (
						<a key={league} href={`/${league.toLowerCase()}`}>
							{league}
						</a>
					) : null
				)}
			</nav>

			{/* Visible dropdown menu for users */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
				<DropdownMenuContent className={contentClasses}>
					{LEAGUE === 'NFL' ? (
						<DropdownMenuItem asChild>
							<a href="/nfl/season">2026 NFL Season</a>
						</DropdownMenuItem>
					) : null}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger
							className={`data-[state=open]:bg-${color} focus:bg-${color}`}
						>
							More leagues
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className={contentClasses}>
							{['NFL', 'MLB', 'NBA', 'WNBA', 'NHL', 'MLS'].map((league) =>
								LEAGUE !== league ? (
									<DropdownMenuItem asChild key={league}>
										<a href={`/${league.toLowerCase()}`}>{league}</a>
									</DropdownMenuItem>
								) : null
							)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					{teams.map((t) => (
						<DropdownMenuItem asChild key={t.abbreviation}>
							<a href={`/${lowercaseLeague}/${t.abbreviation.toLowerCase()}`}>
								{t.fullName}
							</a>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	)
}
