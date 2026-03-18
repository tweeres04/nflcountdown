import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import cfbColors from '../cfb_colors.json'

const cfbTeamAbbreviations = cfbColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// CFB 2026 season: late August 2026 through January 2027 (includes bowls + CFP)
const CFB_SEASON_START = '20260822'
const CFB_SEASON_END = '20270120'
const CFB_SCHEDULE_URL = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?limit=1000&dates=${CFB_SEASON_START}-${CFB_SEASON_END}&groups=80`

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'cfb_schedule.json')
		: path.join(__dirname, '..', 'data', 'cfb_schedule.json')

async function fetchAndSaveCfbSchedule() {
	try {
		console.log(`Fetching CFB schedule from ${CFB_SCHEDULE_URL}...`)
		const response = await fetch(CFB_SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const scheduleData = await response.json()

		// Filter to only include games where both teams are in our Power 4 + ND list
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
				cfbTeamAbbreviations.includes(homeTeam.team.abbreviation) &&
				cfbTeamAbbreviations.includes(awayTeam.team.abbreviation)
			)
		})

		const outputData = {
			...scheduleData,
			events: filteredEvents,
		}

		console.log(`Saving CFB schedule to ${OUTPUT_FILE}...`)
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData))

		console.log(
			`Successfully fetched and saved CFB schedule (${filteredEvents.length} games).`
		)
	} catch (error) {
		console.error('Error fetching or saving CFB schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveCfbSchedule()
