import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from '@remix-run/react'
import { defaultFilter, useCommandState } from 'cmdk'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command'
import { LEAGUES, teamLogo } from '~/lib/leagues'
import { POPULAR_PAGES } from '~/lib/popular-pages'
import type { SidebarTeam, TeamsByLeague } from '~/lib/getTeams'
import { getLeagueDisplayName, getLeagueFullName } from '~/lib/schema-helpers'
import mixpanel from 'mixpanel-browser'
import Logo from './logo'

// Tracks settled queries: fires once the query stops changing for a second.
// Lives inside <Command> so useCommandState can read the result count,
// which makes zero-result queries findable in Mixpanel.
function TrackQuery({ query, location }: { query: string; location: string }) {
	const results = useCommandState((state) => state.filtered.count)

	useEffect(() => {
		if (!query) {
			return
		}
		const handle = setTimeout(() => {
			mixpanel.track('search', { query, results, location })
		}, 1000)
		return () => clearTimeout(handle)
	}, [query, results, location])

	return null
}

type Props = {
	allTeams: TeamsByLeague
	// Where this instance lives; sent with every analytics event.
	location: 'homepage' | 'sidebar' | 'league' | 'season'
	// League ranked first among equally good matches (e.g. the league page's
	// own league); the rest follow in homepage popularity order.
	priorityLeague?: string
	// lg is the oversized homepage hero search; default fits the sidebar.
	size?: 'default' | 'lg'
	// Focus this instance on cmd/ctrl+K. Only one instance per page should
	// register it.
	shortcut?: boolean
	// Runs before the shortcut focuses the input (e.g. open the sidebar).
	onShortcut?: () => void
	// Lists the most-visited pages once the input is focused but before
	// anything is typed: the priority league's own when it has any,
	// otherwise the site-wide top. The page the visitor is already on is
	// skipped.
	showPopular?: boolean
}

export default function TeamSearch({
	allTeams,
	location,
	priorityLeague,
	size = 'default',
	shortcut = false,
	onShortcut,
	showPopular = false,
}: Props) {
	const [query, setQuery] = useState('')
	const [focused, setFocused] = useState(false)
	const { pathname } = useLocation()
	const inputRef = useRef<HTMLInputElement>(null)
	const listRef = useRef<HTMLDivElement>(null)

	// cmdk scrolls its selected item into view while results re-sort, which
	// can leave the list partially scrolled on open. Pin it back to the top
	// (after cmdk's frame) so the best match is always visible.
	useEffect(() => {
		requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0 }))
	}, [query])

	// value → league rank so the filter can break score ties by league
	// popularity (equally good matches, e.g. "miami", sort NFL first).
	const leagueRankByValue = useMemo(() => {
		const orderedLeagues = priorityLeague
			? [priorityLeague, ...LEAGUES.filter((l) => l !== priorityLeague)]
			: LEAGUES
		const ranks = new Map<string, number>()
		orderedLeagues.forEach((league, rank) => {
			ranks.set(getLeagueDisplayName(league).toLowerCase(), rank)
			for (const t of allTeams[league] ?? []) {
				ranks.set(`${league} ${t.fullName}`.toLowerCase(), rank)
			}
		})
		return ranks
	}, [allTeams, priorityLeague])

	const popularPages = useMemo(() => {
		const inLeague = POPULAR_PAGES.filter((p) => p.league === priorityLeague)
		const picks = inLeague.length > 0 ? inLeague : POPULAR_PAGES
		return picks.filter((p) => p.path !== pathname).slice(0, 5)
	}, [priorityLeague, pathname])

	const leagueValues = useMemo(
		() => new Set(LEAGUES.map((l) => getLeagueDisplayName(l).toLowerCase())),
		[]
	)

	// cmdk's default fuzzy score, nudged by league popularity. The nudge is
	// far smaller than any real score difference, so it only reorders ties.
	// Leagues that genuinely match float above team results ("world" shows
	// World Cup and Women's World Cup before 48 team rows). The 0.5 cutoff
	// separates real matches (measured ≥0.89) from junk fuzzy subsequences
	// like "seatt" → "National Ba*S*k*E*tball *A*ssocia*T*ion" (≤0.003).
	function filter(value: string, search: string, keywords?: string[]) {
		const score = defaultFilter(value, search, keywords)
		if (score === 0) {
			return 0
		}
		const rank = leagueRankByValue.get(value.toLowerCase()) ?? LEAGUES.length
		const nudged = score + (LEAGUES.length - rank) / 10000
		if (score > 0.5 && leagueValues.has(value.toLowerCase())) {
			return nudged + 1
		}
		return nudged
	}

	useEffect(() => {
		if (!shortcut) {
			return
		}
		function handleKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault()
				mixpanel.track('focus search with keyboard shortcut', { location })
				onShortcut?.()
				// Focus next frame so a sidebar opened by onShortcut has rendered
				requestAnimationFrame(() => inputRef.current?.focus())
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [shortcut, onShortcut, location])

	function renderLeagueItem(league: string) {
		const lowercaseLeague = league.toLowerCase()
		return (
			<CommandItem
				key={league}
				value={getLeagueDisplayName(league)}
				keywords={[getLeagueFullName(league)]}
				onSelect={() => {
					mixpanel.track('select search result', {
						query,
						result: getLeagueDisplayName(league),
						resultType: 'league',
						league,
						location,
					})
					window.location.assign(`/${lowercaseLeague}`)
				}}
				className="gap-3 py-2"
			>
				<Logo src={`/logos/${lowercaseLeague}.svg`} className="size-6" />
				<span className="font-semibold">{getLeagueDisplayName(league)}</span>
				<span className="text-stone-400">{getLeagueFullName(league)}</span>
			</CommandItem>
		)
	}

	function renderSeasonItem(league: string) {
		const lowercaseLeague = league.toLowerCase()
		const label = `${getLeagueDisplayName(league)} season`
		return (
			<CommandItem
				key={`${league}-season`}
				value={label}
				onSelect={() => {
					mixpanel.track('select search result', {
						query,
						result: label,
						resultType: 'season',
						league,
						location,
					})
					window.location.assign(`/${lowercaseLeague}/season`)
				}}
				className="gap-3 py-2"
			>
				<Logo src={`/logos/${lowercaseLeague}.svg`} className="size-6" />
				<span className="font-semibold">{label}</span>
			</CommandItem>
		)
	}

	// A popular page is a league page, its season page, or a team page.
	function renderPopularItem({
		league,
		path,
	}: {
		league: string
		path: string
	}) {
		const lowercaseLeague = league.toLowerCase()
		if (path === `/${lowercaseLeague}`) {
			return renderLeagueItem(league)
		}
		if (path === `/${lowercaseLeague}/season`) {
			return renderSeasonItem(league)
		}
		const abbrev = path.slice(path.lastIndexOf('/') + 1)
		const team = (allTeams[league] ?? []).find(
			(t) => t.abbreviation.toLowerCase() === abbrev
		)
		return team ? renderTeamItem(league, team) : null
	}

	function renderTeamItem(league: string, t: SidebarTeam) {
		const lowercaseLeague = league.toLowerCase()
		const abbrev = t.abbreviation.toLowerCase()
		return (
			<CommandItem
				key={`${league}-${t.abbreviation}`}
				value={`${league} ${t.fullName}`}
				onSelect={() => {
					mixpanel.track('select search result', {
						query,
						result: t.fullName,
						resultType: 'team',
						league,
						location,
					})
					window.location.assign(`/${lowercaseLeague}/${abbrev}`)
				}}
				className="gap-3 py-2"
			>
				<Logo
					src={teamLogo(league, abbrev)}
					fallbackSrc={`/logos/${lowercaseLeague}.svg`}
					className="size-6"
				/>
				{t.fullName}
				<span className="ml-auto text-xs text-stone-400">
					{getLeagueDisplayName(league)}
				</span>
			</CommandItem>
		)
	}

	return (
		// The `dark` class opts descendants into the ui components' dark:
		// variants; it doesn't apply to this element itself, so the root
		// surface colors are set explicitly.
		<Command
			filter={filter}
			className="dark rounded-lg border border-stone-700 bg-stone-950 text-stone-50 shadow-md"
		>
			<CommandInput
				ref={inputRef}
				placeholder="Search any team or league…"
				value={query}
				onValueChange={setQuery}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				className={size === 'lg' ? 'h-14 text-lg' : undefined}
			/>
			<TrackQuery query={query} location={location} />
			{/* Only show results while typing; otherwise the full team list
			    would dump onto the page below the input. Before typing, pages
			    that opt in get a short list of popular teams instead. */}
			{query ? (
				<CommandList ref={listRef}>
					<CommandEmpty>No teams or leagues found.</CommandEmpty>
					{LEAGUES.map(renderLeagueItem)}
					{LEAGUES.flatMap((league) =>
						(allTeams[league] ?? []).map((t) => renderTeamItem(league, t))
					)}
				</CommandList>
			) : showPopular && focused && popularPages.length > 0 ? (
				// Pressing an item would blur the input and unmount this list
				// before the click lands; keep focus in the input instead.
				<CommandList onMouseDown={(e) => e.preventDefault()}>
					<CommandGroup heading="Popular">
						{popularPages.map(renderPopularItem)}
					</CommandGroup>
				</CommandList>
			) : null}
		</Command>
	)
}
