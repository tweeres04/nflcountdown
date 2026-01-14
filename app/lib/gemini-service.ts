import { GoogleGenAI } from '@google/genai'
import { Game, Team } from './types'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

// Simple in-memory cache to avoid repeated API calls
const previewCache = new Map<
	string,
	{ preview: string | null; timestamp: number }
>()

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

	const prompt = `You are a bullet point game summarizer. Tell us about any exciting storylines in this ${league} matchup. Respond with only bullet points, and keep it to 3 bullet points or less:
${team.fullName} vs ${opponentTeam?.fullName || 'TBD'}
Game Date: ${gameDate}`

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
	const now = Date.now()
	const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

	// Cleanup old entries occasionally (simple garbage collection)
	// Wrapped in setTimeout to unblock the request flow
	if (previewCache.size > 100) {
		setTimeout(() => {
			for (const [key, value] of previewCache.entries()) {
				if (Date.now() - value.timestamp > CACHE_TTL) {
					previewCache.delete(key)
				}
			}
		}, 0)
	}

	// Check cache first (24 hour cache)
	const cached = previewCache.get(game.id)
	if (cached && now - cached.timestamp < CACHE_TTL) {
		return cached.preview
	}

	// Generate new preview
	const preview = await generateGamePreview(league, game, team)

	// Cache the result
	previewCache.set(game.id, { preview, timestamp: now })

	return preview
}
