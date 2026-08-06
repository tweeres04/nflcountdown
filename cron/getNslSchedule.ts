import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import nslColors from '../nsl_colors.json'

const nslTeamAbbreviations = nslColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// NSL season runs roughly April - November; playoffs land inside the window.
// The dates range selects the season — the response's season.year field
// always reports the current season, so don't trust it.
const year = new Date().getFullYear()
const NSL_SEASON_START = `${year}0401`
const NSL_SEASON_END = `${year}1130`
const NSL_SCHEDULE_URL = `https://site.api.espn.com/apis/site/v2/sports/soccer/can.w.nsl/scoreboard?limit=1000&dates=${NSL_SEASON_START}-${NSL_SEASON_END}`

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'nsl_schedule.json')
		: path.join(__dirname, '..', 'data', 'nsl_schedule.json')

async function fetchAndSaveNslSchedule() {
	try {
		console.log(`Fetching NSL schedule from ${NSL_SCHEDULE_URL}...`)
		const response = await fetch(NSL_SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const scheduleData = await response.json()

		// Filter to only include valid NSL teams
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
				nslTeamAbbreviations.includes(homeTeam.team.abbreviation) &&
				nslTeamAbbreviations.includes(awayTeam.team.abbreviation)
			)
		})

		const outputData = {
			...scheduleData,
			events: filteredEvents,
		}

		console.log(`Saving NSL schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData))

		console.log(
			`Successfully fetched and saved NSL schedule (${filteredEvents.length} matches).`
		)
	} catch (error) {
		console.error('Error fetching or saving NSL schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveNslSchedule()
