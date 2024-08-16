import schedule from '../../nfl_schedule.json'
import mlbTeams from '../../mlb_teams.json'
import { uniqBy } from 'lodash-es'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeams, nbaTeamToTeam } from '~/lib/nbaGameToGame'

export async function loader() {
	const LEAGUE = process.env.LEAGUE ?? 'NFL'
	let teams =
		LEAGUE === 'MLB'
			? mlbTeams.teams.map(mlbTeamToTeam)
			: LEAGUE === 'NBA'
			? nbaTeams.map(nbaTeamToTeam)
			: uniqBy(
					schedule.games.map((g) => g.homeTeam),
					'id'
			  )

	let body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
        <loc>https://${LEAGUE.toLowerCase()}countdown.tweeres.ca</loc>
    </url>
${teams
	.map((t) => {
		return `    <url>
        <loc>https://${LEAGUE.toLowerCase()}countdown.tweeres.ca/${t.abbreviation.toLowerCase()}</loc>
    </url>`
	})
	.join('\n')}
</urlset>`

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
		},
	})
}
