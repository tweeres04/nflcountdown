import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import nwslColors from '../nwsl_colors.json'

const nwslTeamAbbreviations = nwslColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// NWSL 2026 season: March 13 - November 1
const NWSL_SEASON_START = '20260313'
const NWSL_SEASON_END = '20261101'
const NWSL_SCHEDULE_URL = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard?limit=1000&dates=${NWSL_SEASON_START}-${NWSL_SEASON_END}`

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'nwsl_schedule.json')
		: path.join(__dirname, '..', 'data', 'nwsl_schedule.json')

async function fetchAndSaveNwslSchedule() {
	try {
		console.log(`Fetching NWSL schedule from ${NWSL_SCHEDULE_URL}...`)
		const response = await fetch(NWSL_SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const scheduleData = await response.json()

		// Filter to only include valid NWSL teams
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
				nwslTeamAbbreviations.includes(homeTeam.team.abbreviation) &&
				nwslTeamAbbreviations.includes(awayTeam.team.abbreviation)
			)
		})

		const outputData = {
			...scheduleData,
			events: filteredEvents,
		}

		console.log(`Saving NWSL schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData))

		console.log(
			`Successfully fetched and saved NWSL schedule (${filteredEvents.length} matches).`
		)
	} catch (error) {
		console.error('Error fetching or saving NWSL schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveNwslSchedule()
