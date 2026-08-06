import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import cflColors from '../cfl_colors.json'

const cflTeamAbbreviations = cflColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Official CFL scoreboard feed (the data source behind cfl.ca/schedule).
// Returns a top-level array of rounds with games in `tournaments`.
const CFL_SCHEDULE_URL =
	'https://cflscoreboard.cfl.ca/json/scoreboard/rounds.json'

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'cfl_schedule.json')
		: path.join(__dirname, '..', 'data', 'cfl_schedule.json')

async function fetchAndSaveCflSchedule() {
	try {
		console.log(`Fetching CFL schedule from ${CFL_SCHEDULE_URL}...`)
		const response = await fetch(CFL_SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const rounds = await response.json()

		// Drop preseason; the team whitelist also drops playoff placeholder
		// games whose squads are still "TBD".
		const filteredRounds = rounds
			.filter((round: any) => round.type !== 'PRE')
			.map((round: any) => ({
				...round,
				tournaments: round.tournaments.filter(
					(game: any) =>
						game.homeSquad?.shortName &&
						game.awaySquad?.shortName &&
						cflTeamAbbreviations.includes(game.homeSquad.shortName) &&
						cflTeamAbbreviations.includes(game.awaySquad.shortName)
				),
			}))

		const gameCount = filteredRounds.reduce(
			(sum: number, round: any) => sum + round.tournaments.length,
			0
		)

		console.log(`Saving CFL schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify({ rounds: filteredRounds }))

		console.log(
			`Successfully fetched and saved CFL schedule (${gameCount} games).`
		)
	} catch (error) {
		console.error('Error fetching or saving CFL schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveCflSchedule()
