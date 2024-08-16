import { ReactNode, useContext } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
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
	const color = lowercaseAbbreviation
		? LEAGUE === 'NFL'
			? lowercaseAbbreviation
			: `${LEAGUE.toLowerCase()}-${lowercaseAbbreviation}`
		: 'stone-900'
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent>
				{teams.map((t) => (
					<DropdownMenuItem asChild>
						<a
							href={`/${t.abbreviation.toLowerCase()}`}
							className={`text-white bg-${color} hover:bg-${color} hover:text-white rounded-none`}
						>
							{t.fullName}
						</a>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
