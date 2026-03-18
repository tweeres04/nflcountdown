import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// HockeyTech API — powers thepwhl.com (key is publicly embedded in their page source)
const HOCKEYTECH_KEY = '446521baf8c38984'
const PWHL_URL = `https://lscluster.hockeytech.com/feed/index.php?feed=modulekit&key=${HOCKEYTECH_KEY}&client_code=pwhl&view=scorebar&numberofdaysahead=365&numberofdaysback=30&limit=1000&fmt=json&site_id=0&lang=en&league_id=1`

// Current season ID — update when a new season starts
const CURRENT_SEASON_ID = '8'

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'pwhl_schedule.json')
		: path.join(__dirname, '..', 'data', 'pwhl_schedule.json')

async function fetchAndSavePwhlSchedule() {
	try {
		console.log('Fetching PWHL schedule from HockeyTech...')
		const response = await fetch(PWHL_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const data = await response.json()
		const allGames = data?.SiteKit?.Scorebar ?? []

		// Filter to current season only
		const games = allGames.filter(
			(g: { SeasonID: string }) => g.SeasonID === CURRENT_SEASON_ID
		)

		const outputData = {
			SiteKit: {
				...data.SiteKit,
				Scorebar: games,
			},
		}

		console.log(`Saving PWHL schedule to ${OUTPUT_FILE}...`)
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData))

		console.log(
			`Successfully saved PWHL schedule (${games.length} games, season ${CURRENT_SEASON_ID}).`
		)
	} catch (error) {
		console.error('Error fetching or saving PWHL schedule:', error)
		process.exit(1)
	}
}

fetchAndSavePwhlSchedule()
