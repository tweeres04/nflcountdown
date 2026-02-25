import fs from 'fs'
import path from 'path'
import type { Game, Team } from './types'

export interface AffiliateLinks {
	tickets?: string
}

export interface CJProduct {
	id: string
	title: string
	performers: string // pipe-delimited, e.g. "Edmonton Oilers|Vancouver Canucks"
	categoryName: string // e.g. "Sports | Baseball | Professional (MLB)"
	travelStartDate: string // ISO 8601
	locationName: string | null
	clickUrl: string
}

// Single cache file for all ticket links, keyed by "team-slug|game-date"
interface CacheEntry {
	clickUrl: string
	cachedAt: string
}

interface CacheFile {
	[key: string]: CacheEntry
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'cache', 'cj-tickets.json')
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const CLEANUP_PROBABILITY = 0.05 // ~5% chance of cleanup on each cache access

const CJ_API_URL = 'https://ads.api.cj.com/query'

// Maps our league codes to the string that appears in TicketNetwork's categoryName
const LEAGUE_CATEGORY: Record<string, string> = {
	NFL: 'NFL',
	MLB: 'MLB',
	NBA: 'NBA',
	NHL: 'NHL',
	WNBA: 'WNBA',
	MLS: 'MLS',
}

function teamSlug(teamFullName: string): string {
	return teamFullName.toLowerCase().replace(/\s+/g, '-')
}

function cacheKey(teamFullName: string, gameDate: string): string {
	return `${teamSlug(teamFullName)}|${gameDate.slice(0, 10)}`
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
		console.error('[cj-service] Failed to write cache:', err)
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

	// Probabilistic cleanup — purge stale entries ~5% of the time
	if (Math.random() < CLEANUP_PROBABILITY) {
		cache = purgeExpiredEntries(cache)
	}

	writeCacheFile(cache)
}

export async function searchTicketNetworkEvents(
	team: Team,
	opponent: Team | null,
	league: string
): Promise<CJProduct[]> {
	const companyId = process.env.CJ_COMPANY_ID
	const pid = process.env.CJ_WEBSITE_PID
	const partnerId = process.env.CJ_TICKETNETWORK_PARTNER_ID
	const token = process.env.CJ_ACCESS_TOKEN

	if (!companyId || !pid || !partnerId || !token) {
		console.error('[cj-service] Missing CJ environment variables')
		return []
	}

	// Use fullName + nickName for both teams to maximize match quality.
	// fullName handles most teams; nickName catches cases like "The Athletics"
	// where TicketNetwork uses a different name than our fullName.
	const keywords = [
		team.fullName,
		team.nickName,
		...(opponent ? [opponent.fullName, opponent.nickName] : []),
	]

	const query = `{
		travelExperienceProducts(
			companyId: "${companyId}",
			partnerIds: ["${partnerId}"],
			keywords: ${JSON.stringify(keywords)},
			limit: 100
		) {
			resultList {
				id
				title
				linkCode(pid: "${pid}") { clickUrl }
				... on TravelExperience {
					travelStartDate
					performers
					locationName
					categoryName
				}
			}
		}
	}`

	try {
		const response = await fetch(CJ_API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ query }),
			signal: AbortSignal.timeout(8000),
		})

		if (!response.ok) {
			console.error('[cj-service] API error:', response.status, await response.text())
			return []
		}

		const json = await response.json()
		const resultList = json?.data?.travelExperienceProducts?.resultList ?? []

		const leagueCategory = LEAGUE_CATEGORY[league]

		return resultList
			.filter((p: Record<string, unknown>) =>
				typeof (p.linkCode as Record<string, unknown>)?.clickUrl === 'string' &&
				typeof p.travelStartDate === 'string' &&
				typeof p.performers === 'string' &&
				typeof p.categoryName === 'string' &&
				// Filter to the correct sport/league
				(leagueCategory ? p.categoryName.includes(leagueCategory) : true) &&
				// Filter out season ticket packages (must have two performers)
				(p.performers as string).includes('|')
			)
			.map((p: Record<string, unknown>) => ({
				id: p.id as string,
				title: p.title as string,
				performers: p.performers as string,
				categoryName: p.categoryName as string,
				travelStartDate: p.travelStartDate as string,
				locationName: (p.locationName as string | null) ?? null,
				clickUrl: (p.linkCode as { clickUrl: string }).clickUrl,
			}))
	} catch (err) {
		console.error('[cj-service] Fetch failed:', err)
		return []
	}
}

export function findGameTicketLink(
	products: CJProduct[],
	gameDate: string | null // ISO date string
): string | null {
	if (products.length === 0) return null

	// Sort by date ascending
	const sorted = products.toSorted(
		(a, b) =>
			new Date(a.travelStartDate).getTime() -
			new Date(b.travelStartDate).getTime()
	)

	// If we have a game date, try to match by date
	if (gameDate) {
		const gameDateStr = gameDate.slice(0, 10) // "YYYY-MM-DD"
		const match = sorted.find(
			(p) => p.travelStartDate.slice(0, 10) === gameDateStr
		)
		if (match) return match.clickUrl
	}

	// Fall back to next upcoming game (first future date)
	const now = new Date()
	const next = sorted.find((p) => new Date(p.travelStartDate) > now)
	return next?.clickUrl ?? null
}

export async function getAffiliateLinks(
	team: Team,
	league: string,
	game?: Game
): Promise<AffiliateLinks | null> {
	const opponent =
		game?.homeTeam?.abbreviation === team.abbreviation
			? game?.awayTeam
			: game?.homeTeam

	const gameDate = game?.time ?? null

	// Check per-event cache first
	if (gameDate) {
		const key = cacheKey(team.fullName, gameDate)
		const cached = getCachedUrl(key)
		if (cached) return { tickets: cached }
	}

	// Cache miss — fetch from CJ API
	const products = await searchTicketNetworkEvents(team, opponent ?? null, league)

	const ticketUrl = findGameTicketLink(products, gameDate)

	if (!ticketUrl) return null

	// Cache the result for this specific game
	if (gameDate) {
		const key = cacheKey(team.fullName, gameDate)
		setCachedUrl(key, ticketUrl)
	}

	return { tickets: ticketUrl }
}
