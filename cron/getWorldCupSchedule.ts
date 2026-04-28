import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// FIFA World Cup 2026 (Canada/Mexico/USA), idSeason=285023, idCompetition=17
const ID_SEASON = '285023'
const SCHEDULE_URL = `https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=${ID_SEASON}`

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'worldcup_schedule.json')
		: path.join(__dirname, '..', 'data', 'worldcup_schedule.json')

async function fetchAndSaveWorldCupSchedule() {
	try {
		console.log(`Fetching World Cup schedule from ${SCHEDULE_URL}...`)
		const response = await fetch(SCHEDULE_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const scheduleData = await response.json()
		const matchCount = scheduleData.Results?.length ?? 0

		console.log(`Saving World Cup schedule to ${OUTPUT_FILE}...`)
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(scheduleData))

		console.log(
			`Successfully fetched and saved World Cup schedule (${matchCount} matches).`
		)
	} catch (error) {
		console.error('Error fetching or saving World Cup schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveWorldCupSchedule()
