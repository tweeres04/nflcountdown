import schedule from '../../nfl_schedule.json'
import { uniqBy } from 'lodash-es'

export async function loader() {
	let teams = uniqBy(
		schedule.games.map((g) => g.homeTeam),
		'id'
	)

	let body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
        <loc>https://nflcountdown.tweeres.ca</loc>
    </url>
${teams
	.map((t) => {
		return `    <url>
        <loc>https://nflcountdown.tweeres.ca/${t.abbreviation.toLowerCase()}</loc>
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
