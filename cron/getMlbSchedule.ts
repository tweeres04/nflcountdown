import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MLB_SCHEDULE_URL = 'https://statsapi.mlb.com/api/v1/schedule'
const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'mlb_schedule.json')
		: path.join(__dirname, '..', 'data', 'mlb_schedule.json')

async function fetchAndSaveMlbSchedule() {
	try {
		console.log(`Fetching MLB schedule from ${MLB_SCHEDULE_URL}...`)
		const url = new URL(MLB_SCHEDULE_URL)

		url.searchParams.append('sportId', '1')
		url.searchParams.append('startDate', '2026-01-01')
		url.searchParams.append('endDate', '2026-12-31')
		url.searchParams.append('timeZone', 'UTC')
		url.searchParams.append('gameType', 'R')
		url.searchParams.append('gameType', 'F')
		url.searchParams.append('gameType', 'D')
		url.searchParams.append('gameType', 'L')
		url.searchParams.append('gameType', 'W')
		url.searchParams.append('language', 'en')
		url.searchParams.append('leagueId', '104')
		url.searchParams.append('leagueId', '103')
		url.searchParams.append('leagueId', '160')
		url.searchParams.append('leagueId', '590')
		url.searchParams.append('sortBy', 'gameDate,gameType')
		// url.searchParams.append('hydrate', 'team')

		const response = await fetch(url)

		if (!response.ok) {
			const error = await response.text()
			throw `HTTP error: ${error}`
		}

		const data = await response.json()

		console.log(`Saving MLB schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(data))

		console.log('Successfully fetched and saved MLB schedule.')
	} catch (error) {
		console.error(error)
		// const mailgun = new Mailgun(FormData)

		// if (!process.env.MAILGUN_API_KEY) {
		// 	throw 'MAILGUN_API_KEY not found'
		// }

		// const mg = mailgun.client({
		// 	username: 'api',
		// 	key: process.env.MAILGUN_API_KEY,
		// })

		// mg.messages.create('mg.tweeres.com', {
		// 	from: `errors@teamcountdown.tweeres.ca`,
		// 	to: 'tweeres04@gmail.com',
		// 	subject: `Error fetching NBA schedule`,
		// 	html: 'There was an error fetching the NBA schedule. Please check the logs for more details.',
		// 	'o:tag': ['nba schedule fetch error'],
		// })

		// console.error('Error fetching or saving NBA schedule:', error)
		// process.exit(1) // Exit with error code
	}
}

fetchAndSaveMlbSchedule()
