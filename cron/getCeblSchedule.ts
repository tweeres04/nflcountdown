import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import ceblColors from '../cebl_colors.json'

const ceblTeamIds = ceblColors.map((team) => team.teamId)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CEBL_API_BASE = 'https://api.data.cebl.ca'
// Public client key baked into the CEBL stats hub's JS bundle
// (cebl-stats-hub.web.app) — same situation as the PWHL HockeyTech key.
// If fetches start returning 401, re-extract it from the stats hub bundle.
const CEBL_API_KEY = '800chyzv2hvur3z0ogh39cve2zok0c'

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'cebl_schedule.json')
		: path.join(__dirname, '..', 'data', 'cebl_schedule.json')

async function fetchJson(pathname: string) {
	const response = await fetch(`${CEBL_API_BASE}${pathname}`, {
		headers: { 'X-Api-Key': CEBL_API_KEY },
	})
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status} for ${pathname}`)
	}
	return response.json()
}

async function fetchAndSaveCeblSchedule() {
	try {
		// The season list is the source of truth for which year to fetch —
		// the next season's games only appear once the league publishes them
		// (typically late winter), so off-season runs keep serving the most
		// recent season until then.
		console.log(`Fetching CEBL seasons from ${CEBL_API_BASE}/seasons/...`)
		const seasons: { year: number; is_active: boolean }[] =
			await fetchJson('/seasons/')
		const season =
			seasons.find((s) => s.is_active) ??
			seasons.reduce((max, s) => (s.year > max.year ? s : max))

		console.log(`Fetching CEBL schedule for ${season.year}...`)
		const games = await fetchJson(`/games/${season.year}/`)

		// Filter to known teams (also drops any placeholder finals games)
		const filteredGames = games.filter(
			(game: any) =>
				ceblTeamIds.includes(game.home_team_id) &&
				ceblTeamIds.includes(game.away_team_id)
		)

		console.log(`Saving CEBL schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify({ games: filteredGames }))

		console.log(
			`Successfully fetched and saved CEBL schedule (${filteredGames.length} games).`
		)
	} catch (error) {
		console.error('Error fetching or saving CEBL schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveCeblSchedule()
