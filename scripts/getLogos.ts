import { writeFile } from 'node:fs/promises'
import { uniqBy } from 'lodash-es'
import schedule from '../nfl_schedule.json'

const teams = uniqBy(
	schedule.games.map((g) => g.homeTeam),
	'id'
)

await teams.reduce(
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
