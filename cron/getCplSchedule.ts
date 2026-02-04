import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import cplColors from '../cpl_colors.json'

const cplTeamAbbreviations = cplColors.map((team) => team.abbreviation)

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CPL_SEASONS_URL =
	'https://api-sdp.canpl.ca/v1/cpl/football/competitions/cpl::Football_Competition::85e0d583bc894bb592558598d36c1328/seasons'
const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'cpl_schedule.json')
		: path.join(__dirname, '..', 'data', 'cpl_schedule.json')

async function fetchAndSaveCplSchedule() {
	try {
		// Step 1: Fetch seasons to get the current season ID
		console.log(`Fetching CPL seasons from ${CPL_SEASONS_URL}...`)
		const seasonsResponse = await fetch(CPL_SEASONS_URL)

		if (!seasonsResponse.ok) {
			throw new Error(`HTTP error! status: ${seasonsResponse.status}`)
		}

		const seasonsData = await seasonsResponse.json()

		// Find the most recent season (assuming they're ordered, or find by year)
		const currentYear = new Date().getFullYear()
		const currentSeason = seasonsData.seasons.find(
			(season: any) => season.seasonName === currentYear.toString()
		)

		if (!currentSeason) {
			throw new Error(`No season found for year ${currentYear}`)
		}

		console.log(
			`Found season: ${currentSeason.seasonName} (ID: ${currentSeason.seasonId})`
		)

		// Step 2: Fetch schedule for the current season
		const scheduleUrl = `https://api-sdp.canpl.ca/v1/cpl/football/seasons/${currentSeason.seasonId}/matches`
		console.log(`Fetching CPL schedule from ${scheduleUrl}...`)

		const scheduleResponse = await fetch(scheduleUrl)

		if (!scheduleResponse.ok) {
			throw new Error(`HTTP error! status: ${scheduleResponse.status}`)
		}

		const scheduleData = await scheduleResponse.json()

		// Filter to only include valid CPL teams
		const filteredMatches = scheduleData.matches.filter(
			(match: any) =>
				match.home?.acronymName &&
				match.away?.acronymName &&
				cplTeamAbbreviations.includes(match.home.acronymName) &&
				cplTeamAbbreviations.includes(match.away.acronymName)
		)

		const outputData = {
			...scheduleData,
			matches: filteredMatches,
		}

		console.log(`Saving CPL schedule to ${OUTPUT_FILE}...`)
		// Ensure the directory exists
		await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
		await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData))

		console.log(
			`Successfully fetched and saved CPL schedule (${filteredMatches.length} matches).`
		)
	} catch (error) {
		console.error('Error fetching or saving CPL schedule:', error)
		process.exit(1)
	}
}

fetchAndSaveCplSchedule()
