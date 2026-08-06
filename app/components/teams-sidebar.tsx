import { ChevronLeft, Menu } from 'lucide-react'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '~/components/ui/collapsible'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from '~/components/ui/sidebar'
import type { TeamsByLeague } from '~/lib/getTeams'
import { Team } from '~/lib/types'
import { getLeagueDisplayName } from '~/lib/schema-helpers'
import { LEAGUES, teamLogo } from '~/lib/leagues'
import { cn } from '~/lib/utils'
import TeamSearch from '~/components/team-search'

// Decorative league/team logo (the adjacent text is the accessible label).
// fallbackSrc covers teams whose logo doesn't exist yet (e.g. WWC nations
// before their flags are added) — swap to the league logo instead of
// showing a broken image.
function Logo({ src, fallbackSrc }: { src: string; fallbackSrc?: string }) {
	return (
		<img
			src={src}
			alt=""
			className="size-5 shrink-0 object-contain"
			onError={
				fallbackSrc
					? (e) => {
							e.currentTarget.onerror = null
							e.currentTarget.src = fallbackSrc
					  }
					: undefined
			}
		/>
	)
}

// Button that opens the nav sidebar.
export function TeamsSidebarTrigger() {
	const { toggleSidebar } = useSidebar()
	return (
		<button
			className="-ml-2 flex shrink-0 rounded-sm p-2 hover:bg-white/20"
			onClick={toggleSidebar}
			aria-label="Open team and league navigation"
		>
			<Menu className="size-6" />
		</button>
	)
}

type Props = {
	allTeams: TeamsByLeague
	team?: Team
	// Undefined on the homepage, where no league is current.
	currentLeague?: string
	// The homepage turns this off since its hero search owns cmd/ctrl+K.
	searchShortcut?: boolean
}

export default function TeamsSidebar({
	allTeams,
	team,
	currentLeague,
	searchShortcut = true,
}: Props) {
	const currentAbbrev = team?.abbreviation?.toLowerCase()
	const { setOpen } = useSidebar()

	return (
		<Sidebar>
			<SidebarHeader>
				<a href="/" className="px-2 text-lg font-semibold">
					Team Countdown
				</a>
				<TeamSearch
					allTeams={allTeams}
					location="sidebar"
					shortcut={searchShortcut}
					onShortcut={() => setOpen(true)}
				/>
			</SidebarHeader>
			<SidebarContent>
				{/* Real <nav> landmark so screen readers get a named navigation region
				    (an aria-label on the Sidebar div alone is not a landmark). */}
				<nav aria-label="All teams and leagues">
					<SidebarGroup>
						<SidebarMenu>
							{LEAGUES.map((league) => {
								const teams = allTeams[league] ?? []
								const lowercaseLeague = league.toLowerCase()
								const isCurrentLeague = league === currentLeague
								const isActiveLeague = isCurrentLeague && !team
								const leagueName = getLeagueDisplayName(league)

								// A league with no team list falls back to a plain link.
								if (teams.length === 0) {
									return (
										<SidebarMenuItem key={league}>
											<SidebarMenuButton asChild isActive={isActiveLeague}>
												<a href={`/${lowercaseLeague}`}>
													<Logo src={`/logos/${lowercaseLeague}.svg`} />
													{leagueName}
												</a>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								}

								return (
									<Collapsible
										key={league}
										asChild
										defaultOpen={isCurrentLeague}
										className="group/collapsible"
									>
										<SidebarMenuItem>
											{/*
											 * The name links to the league; the rest of the row toggles.
											 * Hover/active highlight lives on the row so the whole row lights
											 * up, not just the text link.
											 */}
											<div
												className={cn(
													'flex items-center rounded-md hover:bg-sidebar-accent',
													isActiveLeague && 'bg-sidebar-accent font-medium'
												)}
											>
												<SidebarMenuButton asChild className="w-auto">
													<a href={`/${lowercaseLeague}`}>
														<Logo src={`/logos/${lowercaseLeague}.svg`} />
														{leagueName}
													</a>
												</SidebarMenuButton>
												<CollapsibleTrigger
													aria-label={`Toggle ${leagueName} teams`}
													className="flex flex-1 items-center justify-end self-stretch px-2"
												>
													<ChevronLeft className="size-4 transition-transform group-data-[state=open]/collapsible:-rotate-90" />
												</CollapsibleTrigger>
											</div>
											{/*
											 * forceMount keeps every team link in the SSR DOM so crawlers
											 * see them even while the league is collapsed; data-[state=closed]
											 * hides it visually (Radix's forceMount leaves it shown otherwise).
											 */}
											<CollapsibleContent
												forceMount
												className="data-[state=closed]:hidden"
											>
												<SidebarMenuSub>
													{teams.map((t) => {
														const abbrev = t.abbreviation.toLowerCase()
														return (
															<SidebarMenuSubItem key={t.abbreviation}>
																<SidebarMenuSubButton
																	asChild
																	isActive={
																		isCurrentLeague && abbrev === currentAbbrev
																	}
																>
																	<a href={`/${lowercaseLeague}/${abbrev}`}>
																		<Logo
																			src={teamLogo(league, abbrev)}
																			fallbackSrc={`/logos/${lowercaseLeague}.svg`}
																		/>
																		<span>{t.fullName}</span>
																	</a>
																</SidebarMenuSubButton>
															</SidebarMenuSubItem>
														)
													})}
												</SidebarMenuSub>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>
								)
							})}
						</SidebarMenu>
					</SidebarGroup>
				</nav>
			</SidebarContent>
		</Sidebar>
	)
}
