import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import wnbaColors from '../wnba_colors.json'

const wnbaTeamAbbreviations = wnbaColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const WNBA_SCHEDULE_URL =
	'https://cdn.wnba.com/static/json/staticData/scheduleLeagueV2.json'
const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'wnba_schedule.json')
		: path.join(__dirname, '..', 'data', 'wnba_schedule.json')

async function fetchAndSaveWnbaSchedule() {
	try {
		console.log(`Fetching WNBA schedule from ${WNBA_SCHEDULE_URL}...`)
		const response = await fetch(WNBA_SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const data = await response.json()

		// Filter out preseason, international teams, and special events (like All-Star Game)
		const onlyWnbaGames = data.leagueSchedule.gameDates.map((gameDate) => ({
			...gameDate,
			games: gameDate.games.filter(
				(game) =>
					// Only include games with WNBA teams (skip games with null team tricodes like All-Star Game)
					game.homeTeam?.teamTricode &&
					game.awayTeam?.teamTricode &&
					wnbaTeamAbbreviations.includes(
						game.homeTeam.teamTricode.toUpperCase()
					) &&
					wnbaTeamAbbreviations.includes(game.awayTeam.teamTricode.toUpperCase()) &&
					// Exclude preseason games
					game.gameLabel !== 'Preseason'
			),
		}))

		data.leagueSchedule.gameDates = onlyWnbaGames

		console.log(`Saving WNBA schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(data))

		console.log('Successfully fetched and saved WNBA schedule.')
	} catch (error) {
		console.error('Error fetching or saving WNBA schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveWnbaSchedule()
