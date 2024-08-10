import { ReactNode } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import games from '../../../nfl_schedule.json'

type Props = {
	teams: (typeof games)['games'][0]['homeTeam'][]
	lowercaseAbbreviation?: string
	children: ReactNode
}

export default function TeamsDropdown({
	teams,
	lowercaseAbbreviation = 'stone-900',
	children,
}: Props) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent>
				{teams.map((t) => (
					<DropdownMenuItem asChild>
						<a
							href={`/${t.abbreviation.toLowerCase()}`}
							className={`text-white bg-${lowercaseAbbreviation} hover:bg-${lowercaseAbbreviation} hover:text-white rounded-none`}
						>
							{t.fullName}
						</a>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
