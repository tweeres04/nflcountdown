import schedule from '../../nfl_schedule.json'
import mlbSchedule from '../../mlb_schedule.json'
import nbaSchedule from '../../nba_schedule.json'
import mlbTeams from '../../mlb_teams.json'
import { uniqBy } from 'lodash-es'
import { mlbGameToGame, mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaGameToGame, nbaTeams, nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { getGameSlug } from '~/lib/getGameSlug'

export async function loader() {
	const leagues = ['NFL', 'MLB', 'NBA']

	let allUrls: string[] = []

	// Add home page
	allUrls.push(`    <url>
        <loc>https://teamcountdown.com</loc>
    </url>`)

	for (const LEAGUE of leagues) {
		const lowercaseLeague = LEAGUE.toLowerCase()

		let teams =
			LEAGUE === 'MLB'
				? mlbTeams.teams.map(mlbTeamToTeam)
				: LEAGUE === 'NBA'
				? nbaTeams.map(nbaTeamToTeam)
				: uniqBy(
						schedule.games.map((g) => g.homeTeam),
						'id'
				  )

		// Get all games for sitemap
		const games =
			LEAGUE === 'MLB'
				? mlbSchedule.dates.flatMap((d) => d.games).map(mlbGameToGame)
				: LEAGUE === 'NBA'
				? nbaSchedule.leagueSchedule.gameDates
						.flatMap((gd) => gd.games)
						.filter((g) => g.homeTeam.teamId > 0)
						.map(nbaGameToGame)
				: schedule.games

		// Add league index page
		allUrls.push(`    <url>
        <loc>https://teamcountdown.com/${lowercaseLeague}</loc>
    </url>`)

		// Add season page for NFL
		if (LEAGUE === 'NFL') {
			allUrls.push(`    <url>
        <loc>https://teamcountdown.com/nfl/season</loc>
    </url>`)
		}

		teams.forEach((t) => {
			const teamAbbrev = t.abbreviation.toLowerCase()
			const teamGames = games.filter(
				(g) => g.homeTeam?.id === t.id || g.awayTeam?.id === t.id
			)

			// Team index page
			allUrls.push(`    <url>
        <loc>https://teamcountdown.com/${lowercaseLeague}/${teamAbbrev}</loc>
    </url>`)

			// Individual game pages
			teamGames.forEach((g) => {
				const gameSlug = getGameSlug(g, t.abbreviation)
				if (!gameSlug) return

				allUrls.push(`    <url>
        <loc>https://teamcountdown.com/${lowercaseLeague}/${teamAbbrev}/${gameSlug}</loc>
    </url>`)
			})
		})
	}

	let body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join('\n')}
</urlset>`

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
		},
	})
}
