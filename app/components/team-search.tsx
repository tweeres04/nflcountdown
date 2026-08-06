import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultFilter, useCommandState } from 'cmdk'
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command'
import { LEAGUES, teamLogo } from '~/lib/leagues'
import type { TeamsByLeague } from '~/lib/getTeams'
import { getLeagueDisplayName, getLeagueFullName } from '~/lib/schema-helpers'
import { analytics as mixpanel } from '~/lib/analytics'

// Decorative logo; the item text is the accessible label.
// fallbackSrc covers teams whose logo doesn't exist yet (e.g. WWC nations
// before their flags are added) — swap to the league logo instead of
// showing a broken image.
function Logo({ src, fallbackSrc }: { src: string; fallbackSrc?: string }) {
	return (
		<img
			src={src}
			alt=""
			className="size-6 shrink-0 object-contain"
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
}

export default function TeamSearch({
	allTeams,
	location,
	priorityLeague,
	size = 'default',
	shortcut = false,
	onShortcut,
}: Props) {
	const [query, setQuery] = useState('')
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

	// cmdk's default fuzzy score, nudged by league popularity. The nudge is
	// far smaller than any real score difference, so it only reorders ties.
	function filter(value: string, search: string, keywords?: string[]) {
		const score = defaultFilter(value, search, keywords)
		if (score === 0) {
			return 0
		}
		const rank = leagueRankByValue.get(value.toLowerCase()) ?? LEAGUES.length
		return score + (LEAGUES.length - rank) / 10000
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
				className={size === 'lg' ? 'h-14 text-lg' : undefined}
			/>
			<TrackQuery query={query} location={location} />
			{/* Only show results while typing; otherwise the full team list
			    would dump onto the page below the input. */}
			{query ? (
				<CommandList ref={listRef}>
					<CommandEmpty>No teams or leagues found.</CommandEmpty>
					{LEAGUES.map((league) => {
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
								<Logo src={`/logos/${lowercaseLeague}.svg`} />
								<span className="font-semibold">
									{getLeagueDisplayName(league)}
								</span>
								<span className="text-stone-400">
									{getLeagueFullName(league)}
								</span>
							</CommandItem>
						)
					})}
					{LEAGUES.flatMap((league) => {
						const lowercaseLeague = league.toLowerCase()
						return (allTeams[league] ?? []).map((t) => {
							const abbrev = t.abbreviation.toLowerCase()
							return (
								<CommandItem
									key={`${league}-${t.abbreviation}`}
									value={`${league} ${t.fullName}`}
									keywords={[t.abbreviation]}
									onSelect={() => {
										mixpanel.track('select search result', {
											query,
											result: t.fullName,
											resultType: 'team',
											league,
											location,
										})
										window.location.assign(
											`/${lowercaseLeague}/${abbrev}`
										)
									}}
									className="gap-3 py-2"
								>
									<Logo
										src={teamLogo(league, abbrev)}
										fallbackSrc={`/logos/${lowercaseLeague}.svg`}
									/>
									{t.fullName}
									<span className="ml-auto text-xs text-stone-400">
										{getLeagueDisplayName(league)}
									</span>
								</CommandItem>
							)
						})
					})}
				</CommandList>
			) : null}
		</Command>
	)
}
