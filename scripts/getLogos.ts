import { writeFile } from 'node:fs/promises'
import { uniqBy } from 'lodash-es'
import schedule from '../nfl_schedule.json'
import { nbaTeams } from '~/lib/nbaGameToGame'

const LEAGUE = process.env.LEAGUE ?? 'NFL'
const teams =
	LEAGUE === 'NBA'
		? nbaTeams
		: uniqBy(
				schedule.games.map((g) => g.homeTeam),
				'id'
		  )

const fn = LEAGUE === 'NBA' ? getNbaLogos : getNflLogos

await fn()

async function getNflLogos() {
	const nflTeams = teams as any[]
	await nflTeams.reduce(
		(p, t) =>
			p.then(async () => {
				const svgText = await fetch(
					t.currentLogo.replace('/{formatInstructions}', '')
				).then((response) => response.text())

				const filename = `scripts/${t.abbreviation.toLowerCase()}.svg`

				return writeFile(filename, svgText).then(() => {
					console.log(`Saved ${filename}`)
				})
			}),
		Promise.resolve()
	)
	console.log('Saved all logos!')
}

async function getNbaLogos() {
	await nbaTeams.reduce(
		(p, t) =>
			p.then(async () => {
				const svgText = await fetch(
					`https://cdn.nba.com/logos/nba/${t.teamId}/global/L/logo.svg`
				).then((response) => response.text())

				const filename = `scripts/nba_logos/${t.teamTricode.toLowerCase()}.svg`

				return writeFile(filename, svgText).then(() => {
					console.log(`Saved ${filename}`)
				})
			}),
		Promise.resolve()
	)
	console.log('Saved all logos!')
}
