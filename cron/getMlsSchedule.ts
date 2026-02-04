import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import mlsColors from '../mls_colors.json'

const mlsTeamAbbreviations = mlsColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// MLS 2026 season: Feb 21 - Nov 7 (from ESPN calendar data)
const MLS_SEASON_START = '20260221'
const MLS_SEASON_END = '20261107'
const MLS_SCHEDULE_URL = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?limit=1000&dates=${MLS_SEASON_START}-${MLS_SEASON_END}`

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'mls_schedule.json')
		: path.join(__dirname, '..', 'data', 'mls_schedule.json')

async function fetchAndSaveMlsSchedule() {
	try {
		console.log(`Fetching MLS schedule from ${MLS_SCHEDULE_URL}...`)
		const response = await fetch(MLS_SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const scheduleData = await response.json()

		// Filter to only include valid MLS teams
		const filteredEvents = scheduleData.events.filter((event: any) => {
			const competition = event.competitions?.[0]
			if (!competition) return false

			const homeTeam = competition.competitors?.find(
				(c: any) => c.homeAway === 'home'
			)
			const awayTeam = competition.competitors?.find(
				(c: any) => c.homeAway === 'away'
			)

			return (
				homeTeam?.team?.abbreviation &&
				awayTeam?.team?.abbreviation &&
				mlsTeamAbbreviations.includes(homeTeam.team.abbreviation) &&
				mlsTeamAbbreviations.includes(awayTeam.team.abbreviation)
			)
		})

		const outputData = {
			...scheduleData,
			events: filteredEvents,
		}

		console.log(`Saving MLS schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData))

		console.log(
			`Successfully fetched and saved MLS schedule (${filteredEvents.length} matches).`
		)
	} catch (error) {
		console.error('Error fetching or saving MLS schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveMlsSchedule()
