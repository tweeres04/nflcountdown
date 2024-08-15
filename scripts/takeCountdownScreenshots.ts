import puppeteer from 'puppeteer'
import { uniqBy } from 'lodash-es'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'

import schedule from '../nfl_schedule.json'
import mlbTeams from '../mlb_teams.json'

const LEAGUE = (process.env.LEAGUE ?? 'NFL').toLowerCase()
let teams =
	LEAGUE === 'mlb'
		? mlbTeams.teams.map(mlbTeamToTeam)
		: uniqBy(
				schedule.games.map((g) => g.homeTeam),
				'id'
		  )

const browser = await puppeteer.launch()
const page = await browser.newPage()

await teams.reduce(async (p, team) => {
	await p
	await page.goto(`http://localhost:5173/${team.abbreviation.toLowerCase()}`, {
		waitUntil: 'networkidle2',
	})
	await page.setViewport({ width: 1920, height: 1080 })

	const fileElement = await page.waitForSelector('div.countdown')
	const filename = `public/og/${LEAGUE}/${team.abbreviation.toLowerCase()}.png`
	await fileElement?.screenshot({
		path: filename,
	})

	console.log(`Saved ${filename}`)
}, Promise.resolve())

await browser.close()

console.log('Done')
