import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import nhlColors from '../nhl_colors.json'

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const NHL_API_BASE = 'https://api-web.nhle.com/v1'
const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'nhl_schedule.json')
		: path.join(__dirname, '..', 'data', 'nhl_schedule.json')

// All NHL team abbreviations
const nhlTeamAbbreviations = nhlColors.map((team) => team.abbreviation)

interface NhlGame {
	id: number
	gameDate: string
	startTimeUTC: string
	gameType: number
	gameState: string
	homeTeam: {
		id: number
		commonName: { default: string }
		placeName: { default: string }
		abbrev: string
		score?: number
	}
	awayTeam: {
		id: number
		commonName: { default: string }
		placeName: { default: string }
		abbrev: string
		score?: number
	}
}

interface TeamScheduleResponse {
	games: NhlGame[]
}

async function fetchTeamSchedule(teamAbbrev: string): Promise<NhlGame[]> {
	const url = `${NHL_API_BASE}/club-schedule-season/${teamAbbrev}/now`
	console.log(`Fetching schedule for ${teamAbbrev}...`)

	const response = await fetch(url, {
		headers: {
			Accept: 'application/json',
		},
		redirect: 'follow',
	})

	if (!response.ok) {
		console.error(
			`Failed to fetch schedule for ${teamAbbrev}: ${response.status}`
		)
		return []
	}

	const data: TeamScheduleResponse = await response.json()
	return data.games || []
}

async function fetchAndSaveNhlSchedule() {
	try {
		console.log('Fetching NHL schedules for all teams...')

		// Fetch schedules for all teams in parallel (with some batching to avoid rate limits)
		const allGames: NhlGame[] = []
		const seenGameIds = new Set<number>()

		// Fetch in batches to avoid overwhelming the API
		const batchSize = 2
		for (let i = 0; i < nhlTeamAbbreviations.length; i += batchSize) {
			const batch = nhlTeamAbbreviations.slice(i, i + batchSize)
			const batchResults = await Promise.all(
				batch.map((abbrev) => fetchTeamSchedule(abbrev))
			)

			for (const games of batchResults) {
				for (const game of games) {
					// Deduplicate games by ID
					if (!seenGameIds.has(game.id)) {
						seenGameIds.add(game.id)
						allGames.push(game)
					}
				}
			}

			// Small delay between batches
			if (i + batchSize < nhlTeamAbbreviations.length) {
				await new Promise((resolve) => setTimeout(resolve, 1000))
			}
		}

		// Filter out preseason games (gameType 1) and sort by date
		const regularAndPlayoffGames = allGames
			.filter((game) => game.gameType !== 1)
			.sort(
				(a, b) =>
					new Date(a.startTimeUTC).getTime() -
					new Date(b.startTimeUTC).getTime()
			)

		const outputData = {
			games: regularAndPlayoffGames,
		}

		console.log(`Saving NHL schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData))

		console.log(`Successfully fetched and saved NHL schedule.`)
		console.log(`Total unique games: ${regularAndPlayoffGames.length}`)
		console.log(
			`Regular season games: ${
				regularAndPlayoffGames.filter((g) => g.gameType === 2).length
			}`
		)
		console.log(
			`Playoff games: ${
				regularAndPlayoffGames.filter((g) => g.gameType === 3).length
			}`
		)
	} catch (error) {
		console.error('Error fetching or saving NHL schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveNhlSchedule()
