import puppeteer from 'puppeteer'
import { writeFile } from 'node:fs/promises'
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

async function getAccessToken(): Promise<string> {
	const browser = await puppeteer.launch({
		args:
			process.env.NODE_ENV === 'production'
				? ['--no-sandbox', '--disable-setuid-sandbox']
				: undefined,
	})
	const page = await browser.newPage()

	const accessTokenPromise = new Promise<string>((resolve) => {
		page.on('requestfinished', async (request) => {
			if (request.url().includes('api.nfl.com')) {
				if (
					request.method() === 'POST' &&
					request.url().includes('identity/v3/token')
				) {
					const response = await request.response()?.json()

					const accessToken = response?.accessToken

					resolve(accessToken)
				}
			}
		})
	})

	await page.goto(
		`https://www.nfl.com/schedules/${new Date().getFullYear()}/REG1/`
	)

	await page.locator(`h1 ::-p-text(SCHEDULE)`).wait()

	await accessTokenPromise

	await browser.close()

	return accessTokenPromise
}

async function fetchGames(
	seasonType: SeasonType,
	accessToken: string
): Promise<NflApiResponse> {
	const url = new URL('https://api.nfl.com/experience/v1/games')
	url.searchParams.set('season', '2025')
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
