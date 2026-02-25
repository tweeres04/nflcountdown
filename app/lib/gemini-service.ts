import fs from 'fs'
import path from 'path'
import { GoogleGenAI } from '@google/genai'
import { Game, Team } from './types'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

const CACHE_FILE = path.join(
	process.cwd(),
	'data',
	'cache',
	'gemini-previews.json'
)
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours
const CLEANUP_PROBABILITY = 0.05 // ~5% chance of cleanup on each cache write

interface CacheEntry {
	preview: string | null
	cachedAt: string
}

interface CacheFile {
	[gameId: string]: CacheEntry
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
		console.error('[gemini-service] Failed to write cache:', err)
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

function getCachedPreview(gameId: string): string | null | undefined {
	const cache = readCacheFile()
	const entry = cache[gameId]
	if (!entry) return undefined
	const t = new Date(entry.cachedAt).getTime()
	if (isNaN(t) || Date.now() - t > CACHE_TTL_MS) return undefined
	return entry.preview
}

function setCachedPreview(gameId: string, preview: string | null): void {
	let cache = readCacheFile()

	cache[gameId] = { preview, cachedAt: new Date().toISOString() }

	if (Math.random() < CLEANUP_PROBABILITY) {
		cache = purgeExpiredEntries(cache)
	}

	writeCacheFile(cache)
}

export async function generateGamePreview(
	league: string,
	game: Game,
	team: Team
): Promise<string | null> {
	const opponentTeam =
		game.homeTeam?.abbreviation === team.abbreviation
			? game.awayTeam
			: game.homeTeam

	const gameDate = game.time
		? new Date(game.time).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
		  })
		: 'Date TBD'

	const prompt = `You are a bullet point game summarizer. Tell us about any exciting storylines in this matchup.
	
IMPORTANT:
- Respond with only bullet points. Do not include any preamble before the bullets.
- Keep it to 3 bullet points or less
- Use a casual short tone, like someone telling their buddy about the game
- The point is to get the reader pumped about the game
- Avoid the use of em dashes

<league>${league}</league>
<matchup>${team.fullName} vs ${opponentTeam?.fullName || 'TBD'}</matchup>
<game-date>${gameDate}</game-date>`

	try {
		const result = await ai.models.generateContent({
			model: 'gemini-2.5-flash-lite',
			contents: prompt,
			config: { tools: [{ googleSearch: {} }] },
		})
		return result.text ?? null
	} catch (error) {
		console.error('Gemini API error:', error)
		return null
	}
}

export async function getCachedGamePreview(
	league: string,
	game: Game,
	team: Team
): Promise<string | null> {
	const cached = getCachedPreview(game.id)
	if (cached !== undefined) return cached

	const preview = await generateGamePreview(league, game, team)

	setCachedPreview(game.id, preview)

	return preview
}
