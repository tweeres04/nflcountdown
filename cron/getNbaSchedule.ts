import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url' // Import necessary functions
import nbaColors from '../nba_colors.json'

const nbaTeamAbbreviations = nbaColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const NBA_SCHEDULE_URL =
	'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json'
const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'nba_schedule.json')
		: path.join(__dirname, '..', 'data', 'nba_schedule.json')

async function fetchAndSaveNbaSchedule() {
	try {
		console.log(`Fetching NBA schedule from ${NBA_SCHEDULE_URL}...`)
		const response = await fetch(NBA_SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const data = await response.json()

		const onlyNbaGames = data.leagueSchedule.gameDates.map((gameDate) => ({
			...gameDate,
			games: gameDate.games.filter(
				(game) =>
					nbaTeamAbbreviations.includes(
						game.homeTeam.teamTricode.toUpperCase()
					) &&
					nbaTeamAbbreviations.includes(game.awayTeam.teamTricode.toUpperCase())
			),
		}))

		data.leagueSchedule.gameDates = onlyNbaGames

		console.log(`Saving NBA schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(data))

		console.log('Successfully fetched and saved NBA schedule.')
	} catch (error) {
		console.error('Error fetching or saving NBA schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveNbaSchedule()
