import fs from 'fs'
import path from 'path'
import type { Game, Team } from './types'

interface TicketmasterEvent {
	id: string
	name: string
	url: string
	dates: {
		start: {
			localDate: string // YYYY-MM-DD
			dateTime?: string // ISO 8601 UTC
		}
		status?: {
			code: string // "onsale", "offsale", "canceled", etc.
		}
	}
}

// Cache reuses the same structure as cj-service
interface CacheEntry {
	clickUrl: string
	cachedAt: string
}

interface CacheFile {
	[key: string]: CacheEntry
}

type AttractionsMap = Record<string, Record<string, string>>

const CACHE_FILE = path.join(
	process.cwd(),
	'data',
	'cache',
	'ticketmaster-tickets.json'
)
const ATTRACTIONS_FILE = path.join(
	process.cwd(),
	'data',
	'ticketmaster-attractions.json'
)
const WORLDCUP_SCHEDULE_FILE = path.join(
	process.cwd(),
	'data',
	'worldcup_schedule.json'
)
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const CLEANUP_PROBABILITY = 0.05

const API_BASE = 'https://app.ticketmaster.com/discovery/v2'

let attractionsCache: AttractionsMap | null = null
let worldCupMatchNumberCache: Map<string, number> | null = null

// FIFA's MatchNumber is the join key between FIFA's IdMatch and Ticketmaster
// event names ("World Cup: Match 8 ..."). We resolve it from the schedule
// file at request time and module-cache the lookup map.
function getWorldCupMatchNumber(idMatch: string): number | null {
	if (!worldCupMatchNumberCache) {
		if (!fs.existsSync(WORLDCUP_SCHEDULE_FILE)) {
			worldCupMatchNumberCache = new Map()
		} else {
			try {
				const raw = fs.readFileSync(WORLDCUP_SCHEDULE_FILE, 'utf-8')
				const schedule = JSON.parse(raw) as {
					Results: Array<{ IdMatch: string; MatchNumber: number }>
				}
				worldCupMatchNumberCache = new Map(
					schedule.Results.map((m) => [m.IdMatch, m.MatchNumber])
				)
			} catch {
				worldCupMatchNumberCache = new Map()
			}
		}
	}
	return worldCupMatchNumberCache.get(idMatch) ?? null
}

function getAttractions(): AttractionsMap {
	if (attractionsCache) return attractionsCache
	if (!fs.existsSync(ATTRACTIONS_FILE)) {
		throw new Error(
			`[ticketmaster] Missing ${ATTRACTIONS_FILE} — copy it to the server with: scp data/ticketmaster-attractions.json server:data/`
		)
	}
	const raw = fs.readFileSync(ATTRACTIONS_FILE, 'utf-8')
	attractionsCache = JSON.parse(raw) as AttractionsMap
	return attractionsCache
}

function getAttractionId(
	teamFullName: string,
	league: string
): string | null {
	const attractions = getAttractions()
	return attractions[league]?.[teamFullName] ?? null
}

function teamSlug(teamFullName: string): string {
	return teamFullName.toLowerCase().replace(/\s+/g, '-')
}

function cacheKey(teamFullName: string, gameDate: string): string {
	return `tm|${teamSlug(teamFullName)}|${gameDate.slice(0, 10)}`
}

function readCacheFile(): CacheFile {
	try {
		if (!fs.existsSync(CACHE_FILE)) return {}
		const raw = fs.readFileSync(CACHE_FILE, 'utf-8')
		return JSON.parse(raw) as CacheFile
	} catch {
		return {}
	}
}

function writeCacheFile(cache: CacheFile): void {
	try {
		const dir = path.dirname(CACHE_FILE)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
	} catch (err) {
		console.error('[ticketmaster] Failed to write cache:', err)
	}
}

function purgeExpiredEntries(cache: CacheFile): CacheFile {
	const now = Date.now()
	const pruned: CacheFile = {}
	for (const [key, entry] of Object.entries(cache)) {
		const t = new Date(entry.cachedAt).getTime()
		if (!isNaN(t) && now - t <= CACHE_TTL_MS) {
			pruned[key] = entry
		}
	}
	return pruned
}

function getCachedUrl(key: string): string | null {
	const cache = readCacheFile()
	const entry = cache[key]
	if (!entry) return null
	const t = new Date(entry.cachedAt).getTime()
	if (isNaN(t) || Date.now() - t > CACHE_TTL_MS) return null
	return entry.clickUrl
}

function setCachedUrl(key: string, clickUrl: string): void {
	let cache = readCacheFile()
	cache[key] = { clickUrl, cachedAt: new Date().toISOString() }
	if (Math.random() < CLEANUP_PROBABILITY) {
		cache = purgeExpiredEntries(cache)
	}
	writeCacheFile(cache)
}

async function searchTicketmasterEvents(
	team: Team,
	league: string,
	gameDate: string
): Promise<TicketmasterEvent[]> {
	const apiKey = process.env.TICKET_MASTER_API_KEY
	if (!apiKey) {
		console.error('[ticketmaster] Missing TICKET_MASTER_API_KEY')
		return []
	}

	const attractionId = getAttractionId(team.fullName, league)
	if (!attractionId) {
		console.error(
			`[ticketmaster] No attractionId for ${team.fullName} (${league})`
		)
		return []
	}

	// Narrow the window tightly around the game date so we don't
	// blow the size limit on earlier/later games
	const startDate = new Date(gameDate)
	startDate.setDate(startDate.getDate() - 2)
	const endDate = new Date(gameDate)
	endDate.setDate(endDate.getDate() + 2)

	const params = new URLSearchParams({
		apikey: apiKey,
		attractionId,
		startDateTime: startDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
		endDateTime: endDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
		size: '20',
		sort: 'date,asc',
	})

	try {
		const response = await fetch(`${API_BASE}/events.json?${params}`, {
			signal: AbortSignal.timeout(8000),
		})

		if (!response.ok) {
			console.error(
				'[ticketmaster] API error:',
				response.status,
				await response.text()
			)
			return []
		}

		const json = await response.json()
		const events =
			(json?._embedded?.events as TicketmasterEvent[]) ?? []

		return events.filter(
			(e) => !e.dates.status || e.dates.status.code !== 'canceled'
		)
	} catch (err) {
		console.error('[ticketmaster] Fetch failed:', err)
		return []
	}
}

async function searchWorldCupEvents(
	gameDate: string
): Promise<TicketmasterEvent[]> {
	const apiKey = process.env.TICKET_MASTER_API_KEY
	if (!apiKey) {
		console.error('[ticketmaster] Missing TICKET_MASTER_API_KEY')
		return []
	}

	const startDate = new Date(gameDate)
	startDate.setDate(startDate.getDate() - 1)
	const endDate = new Date(gameDate)
	endDate.setDate(endDate.getDate() + 1)

	const params = new URLSearchParams({
		apikey: apiKey,
		keyword: 'World Cup',
		classificationName: 'Soccer',
		startDateTime: startDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
		endDateTime: endDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
		size: '20',
	})

	try {
		const response = await fetch(`${API_BASE}/events.json?${params}`, {
			signal: AbortSignal.timeout(8000),
		})
		if (!response.ok) {
			console.error(
				'[ticketmaster] WC API error:',
				response.status,
				await response.text()
			)
			return []
		}
		const json = await response.json()
		const events =
			(json?._embedded?.events as TicketmasterEvent[]) ?? []
		return events.filter(
			(e) => !e.dates.status || e.dates.status.code !== 'canceled'
		)
	} catch (err) {
		console.error('[ticketmaster] WC fetch failed:', err)
		return []
	}
}

function findWorldCupMatchUrl(
	events: TicketmasterEvent[],
	matchNumber: number
): string | null {
	const regex = new RegExp(`\\bMatch\\s+${matchNumber}\\b`, 'i')
	const match = events.find((e) => regex.test(e.name))
	return match?.url ?? null
}

function findEventUrl(
	events: TicketmasterEvent[],
	gameDate: string
): string | null {
	if (events.length === 0) return null

	// Both our game.time and Ticketmaster's dateTime are UTC,
	// so we can match directly by date string
	const gameDay = gameDate.slice(0, 10)
	const match = events.find(
		(e) => e.dates.start.dateTime?.slice(0, 10) === gameDay
	)
	if (match) return match.url

	// Fall back to localDate match (dateTime may be missing for some events)
	const localMatch = events.find(
		(e) => e.dates.start.localDate === gameDay
	)
	return localMatch?.url ?? null
}

export async function getTicketmasterLink(
	team: Team,
	league: string,
	game: Game
): Promise<string | null> {
	const gameDate = game.time
	if (!gameDate) return null

	// World Cup matches don't fit the team-attractionId model (each match
	// is its own event). We search the Discovery API by date window and
	// disambiguate by FIFA's MatchNumber, embedded in the TM event name.
	if (league === 'WORLDCUP') {
		const wcKey = `tm-wc|${game.id}`
		const cached = getCachedUrl(wcKey)
		if (cached) return cached

		const matchNumber = getWorldCupMatchNumber(game.id)
		if (matchNumber === null) return null

		const events = await searchWorldCupEvents(gameDate)
		const url = findWorldCupMatchUrl(events, matchNumber)
		if (!url) return null

		setCachedUrl(wcKey, url)
		return url
	}

	const key = cacheKey(team.fullName, gameDate)
	const cached = getCachedUrl(key)
	if (cached) return cached

	const events = await searchTicketmasterEvents(team, league, gameDate)
	const url = findEventUrl(events, gameDate)

	if (!url) return null

	setCachedUrl(key, url)
	return url
}
