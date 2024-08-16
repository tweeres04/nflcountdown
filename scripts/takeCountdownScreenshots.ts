import puppeteer from 'puppeteer'
import { uniqBy, kebabCase } from 'lodash-es'

import { mlbTeamToTeam } from '~/lib/mlbGameToGame'

import schedule from '../nfl_schedule.json'
import mlbTeams from '../mlb_teams.json'
import { teams as nhlTeams } from '../nhl_teams'

const LEAGUE = (process.env.LEAGUE ?? 'NFL').toLowerCase()
let teams =
	LEAGUE === 'mlb'
		? mlbTeams.teams.map(mlbTeamToTeam)
		: LEAGUE === 'nhl'
		? nhlTeams
		: uniqBy(
				schedule.games.map((g) => g.homeTeam),
				'id'
		  )

const browser = await puppeteer.launch()
const page = await browser.newPage()

await teams.reduce(async (p, team) => {
	const slug =
		LEAGUE === 'nhl'
			? kebabCase(team.teamName)
			: team.abbreviation.toLowerCase()
	const pageUrl = `http://localhost:3000/${slug}${
		LEAGUE === 'nhl' ? '/countdown' : ''
	}`
	await p
	await page.goto(pageUrl, {
		waitUntil: 'networkidle2',
	})
	await page.setViewport({ width: 1920, height: 1080 })

	const fileElement = await page.waitForSelector('div#countdown')
	const filename = `public/og/${LEAGUE}/${team.abbreviation.toLowerCase()}.png`
	await fileElement?.screenshot({
		path: filename,
	})

	console.log(`Saved ${filename}`)
}, Promise.resolve())

await browser.close()

console.log('Done')
