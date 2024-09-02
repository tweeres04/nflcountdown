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
	const color = lowercaseAbbreviation
		? LEAGUE === 'NFL'
			? lowercaseAbbreviation
			: `${LEAGUE.toLowerCase()}-${lowercaseAbbreviation}`
		: 'stone-900'

	const contentClasses = `text-white bg-${color} hover:bg-${color} hover:text-white border-0 rounded-none`

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent className={contentClasses}>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger
						className={`data-[state=open]:bg-${color} focus:bg-${color}`}
					>
						More sports
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className={contentClasses}>
						{['NFL', 'MLB', 'NBA', 'NHL'].map((league) =>
							LEAGUE !== league ? (
								<DropdownMenuItem asChild>
									<a
										href={`https://${league.toLowerCase()}countdown.tweeres.com`}
									>
										{league} Countdown
									</a>
								</DropdownMenuItem>
							) : null
						)}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				{teams.map((t) => (
					<DropdownMenuItem asChild>
						<a href={`/${t.abbreviation.toLowerCase()}`}>{t.fullName}</a>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
