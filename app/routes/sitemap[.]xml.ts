import mlbTeams from '../../mlb_teams.json'
import { uniqBy } from 'lodash-es'
import { mlbGameToGame, mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaGameToGame, nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflGameToGame, nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlGameToGame, nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaGameToGame, wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplGameToGame, cplTeamToTeam } from '~/lib/cplGameToGame'
import { mlsGameToGame, mlsTeamToTeam } from '~/lib/mlsGameToGame'
import { getGameSlug } from '~/lib/getGameSlug'
import { readFile } from 'node:fs/promises'
import { MlbScheduleApi, NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, CplScheduleApi, MlsScheduleApi, Team, Game } from '~/lib/types'

export async function loader() {
	const leagues = ['NFL', 'MLB', 'NBA', 'NHL', 'WNBA', 'CPL', 'MLS']

	const [nflScheduleRaw, mlbScheduleRaw, nbaScheduleRaw, nhlScheduleRaw, wnbaScheduleRaw, cplScheduleRaw, mlsScheduleRaw] = await Promise.all([
		readFile('data/nfl_schedule.json', 'utf-8'),
		readFile('data/mlb_schedule.json', 'utf-8'),
		readFile('data/nba_schedule.json', 'utf-8'),
		readFile('data/nhl_schedule.json', 'utf-8'),
		readFile('data/wnba_schedule.json', 'utf-8'),
		readFile('data/cpl_schedule.json', 'utf-8'),
		readFile('data/mls_schedule.json', 'utf-8'),
	])

	const nflSchedule = JSON.parse(nflScheduleRaw) as NflScheduleApi
	const mlbSchedule = JSON.parse(mlbScheduleRaw) as MlbScheduleApi
	const nbaSchedule = JSON.parse(nbaScheduleRaw) as NbaScheduleApi
	const nhlSchedule = JSON.parse(nhlScheduleRaw) as NhlScheduleApi
	const wnbaSchedule = JSON.parse(wnbaScheduleRaw) as WnbaScheduleApi
	const cplSchedule = JSON.parse(cplScheduleRaw) as CplScheduleApi
	const mlsSchedule = JSON.parse(mlsScheduleRaw) as MlsScheduleApi

	let allUrls: string[] = []

	// Add home page
	allUrls.push(`    <url>
        <loc>https://teamcountdown.com</loc>
    </url>`)

	for (const LEAGUE of leagues) {
		const lowercaseLeague = LEAGUE.toLowerCase()

		let teams: Team[] =
			LEAGUE === 'MLB'
				? mlbTeams.teams.map(mlbTeamToTeam)
				: LEAGUE === 'NBA'
				? uniqBy(
						nbaSchedule.leagueSchedule.gameDates
							.flatMap((gd) => gd.games)
							.map((g) => g.homeTeam),
						'teamId'
				  )
						.filter((t) => t.teamId > 0)
						.map(nbaTeamToTeam)
				: LEAGUE === 'NHL'
				? uniqBy(
						nhlSchedule.games.map((g) => g.homeTeam),
						'id'
				  ).map(nhlTeamToTeam)
				: LEAGUE === 'WNBA'
				? uniqBy(
						wnbaSchedule.leagueSchedule.gameDates
							.flatMap((gd) => gd.games)
							.map((g) => g.homeTeam),
						'teamId'
				  )
						.filter((t) => t.teamId > 0)
						.map(wnbaTeamToTeam)
				: LEAGUE === 'CPL'
				? uniqBy(
						cplSchedule.matches.flatMap((m) => [m.home, m.away]),
						'teamId'
				  ).map(cplTeamToTeam)
				: LEAGUE === 'MLS'
				? uniqBy(
						mlsSchedule.events.flatMap((e) => 
							e.competitions[0].competitors.map(c => c.team)
						),
						'id'
				  ).map(mlsTeamToTeam)
				: uniqBy(
						nflSchedule.games.map((g) => g.homeTeam),
						'id'
				  ).map(nflTeamToTeam)

		// Get all games for sitemap
		const games: Game[] =
			LEAGUE === 'MLB'
				? mlbSchedule.dates.flatMap((d) => d.games).map(mlbGameToGame)
				: LEAGUE === 'NBA'
				? nbaSchedule.leagueSchedule.gameDates
						.flatMap((gd) => gd.games)
						.filter((g) => g.homeTeam.teamId > 0)
						.map(g => nbaGameToGame(g))
			: LEAGUE === 'NHL'
			? nhlSchedule.games.map(g => nhlGameToGame(g))
			: LEAGUE === 'WNBA'
			? wnbaSchedule.leagueSchedule.gameDates
					.flatMap((gd) => gd.games)
					.filter((g) => g.homeTeam.teamId > 0)
					.map(g => wnbaGameToGame(g))
			: LEAGUE === 'CPL'
			? cplSchedule.matches.map(m => cplGameToGame(m))
			: LEAGUE === 'MLS'
			? mlsSchedule.events.map(e => mlsGameToGame(e))
			: nflSchedule.games.map(nflGameToGame)

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
