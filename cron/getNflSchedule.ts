import { writeFile } from 'node:fs/promises'
import crypto from 'node:crypto'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

// Type definitions for NFL API response
interface Team {
	id: string
	fullName: string
	abbreviation: string
}

interface Game {
	id: string
	homeTeam: Team
	awayTeam: Team
	date: string
	time: string
	season: string
	seasonType: string
	gameType: string
	status: string
}

interface Pagination {
	limit: number
	token: string
}

interface NflApiResponse {
	games: Game[]
	pagination?: Pagination
}

type SeasonType = 'REG' | 'POST'

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// nfl.com gets an anonymous access token by POSTing these public client
// credentials (baked into its frontend) to the identity endpoint. Replicating
// that request directly avoids spinning up a headless browser just to sniff it.
// These are stable, public web-client creds, but if NFL ever rotates them this
// request will start 401ing (the verify-schedules test will catch it). To
// refresh: open nfl.com/schedules, watch the POST to identity/v3/token in
// devtools, and copy the new clientKey/clientSecret from the request body.
const NFL_TOKEN_URL = 'https://api.nfl.com/identity/v3/token'
const NFL_CLIENT_KEY = '4cFUW6DmwJpzT9L7LrG3qRAcABG5s04g'
const NFL_CLIENT_SECRET = 'CZuvCL49d9OwfGsR'

async function getAccessToken(): Promise<string> {
	const deviceInfo = Buffer.from(
		JSON.stringify({
			model: 'desktop',
			osName: 'macOS',
			osVersion: '10.15.7',
			version: 'Chrome',
		})
	).toString('base64')

	const response = await fetch(NFL_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			clientKey: NFL_CLIENT_KEY,
			clientSecret: NFL_CLIENT_SECRET,
			deviceId: crypto.randomUUID(),
			deviceInfo,
			networkType: 'other',
		}),
	})

	if (!response.ok) {
		throw new Error(`Failed to get NFL access token: ${response.status}`)
	}

	const { accessToken } = (await response.json()) as { accessToken: string }
	return accessToken
}

async function fetchGames(
	seasonType: SeasonType,
	accessToken: string
): Promise<NflApiResponse> {
	const url = new URL('https://api.nfl.com/experience/v1/games')
	url.searchParams.set('season', '2026')
	url.searchParams.set('seasonType', seasonType)
	url.searchParams.set('limit', '10000')

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	return response.json()
}

async function getNflSchedule() {
	const accessToken = await getAccessToken()

	const [regularSeasonData, postseasonData] = await Promise.all([
		fetchGames('REG', accessToken),
		fetchGames('POST', accessToken).catch((err) => {
			console.log('Failed to fetch postseason games:', err.message)
			return { games: [] }
		}),
	])

	const mergedData = {
		...regularSeasonData,
		games: [
			...(regularSeasonData?.games || []),
			...(postseasonData?.games || []),
		],
	}

	const outputFile =
		process.env.NODE_ENV === 'production'
			? path.join(__dirname, 'data', 'nfl_schedule.json')
			: path.join(__dirname, '..', 'data', 'nfl_schedule.json')
	await writeFile(outputFile, JSON.stringify(mergedData))

	console.log(`NFL schedule saved to ${outputFile}`)
	console.log(`Regular season games: ${regularSeasonData?.games?.length || 0}`)
	console.log(`Postseason games: ${postseasonData?.games?.length || 0}`)
	console.log(`Total games: ${mergedData.games.length}`)
}

try {
	getNflSchedule()
} catch (error) {
	console.error('Error fetching NFL schedule:', error)
}
