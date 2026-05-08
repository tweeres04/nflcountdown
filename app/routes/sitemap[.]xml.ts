import mlbTeams from '../../mlb_teams.json'
import { uniqBy } from 'lodash-es'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplTeamToTeam } from '~/lib/cplGameToGame'
import { mlsTeamToTeam } from '~/lib/mlsGameToGame'
import { nwslTeamToTeam } from '~/lib/nwslGameToGame'
import { pwhlTeamToTeam } from '~/lib/pwhlGameToGame'
import { cfbTeamToTeam } from '~/lib/cfbGameToGame'
import { worldCupTeamToTeam } from '~/lib/worldCupGameToGame'
import { readFile } from 'node:fs/promises'
import { NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, CplScheduleApi, MlsScheduleApi, NwslScheduleApi, PwhlScheduleApi, CfbScheduleApi, WorldCupScheduleApi, Team } from '~/lib/types'

export async function loader() {
	const leagues = ['NFL', 'MLB', 'NBA', 'NHL', 'WNBA', 'CPL', 'MLS', 'NWSL', 'PWHL', 'CFB', 'WORLDCUP']

	const [nflScheduleRaw, nbaScheduleRaw, nhlScheduleRaw, wnbaScheduleRaw, cplScheduleRaw, mlsScheduleRaw, nwslScheduleRaw, pwhlScheduleRaw, cfbScheduleRaw, worldCupScheduleRaw] = await Promise.all([
		readFile('data/nfl_schedule.json', 'utf-8'),
		readFile('data/nba_schedule.json', 'utf-8'),
		readFile('data/nhl_schedule.json', 'utf-8'),
		readFile('data/wnba_schedule.json', 'utf-8'),
		readFile('data/cpl_schedule.json', 'utf-8'),
		readFile('data/mls_schedule.json', 'utf-8'),
		readFile('data/nwsl_schedule.json', 'utf-8'),
		readFile('data/pwhl_schedule.json', 'utf-8'),
		readFile('data/cfb_schedule.json', 'utf-8'),
		readFile('data/worldcup_schedule.json', 'utf-8'),
	])

	const nflSchedule = JSON.parse(nflScheduleRaw) as NflScheduleApi
	const nbaSchedule = JSON.parse(nbaScheduleRaw) as NbaScheduleApi
	const nhlSchedule = JSON.parse(nhlScheduleRaw) as NhlScheduleApi
	const wnbaSchedule = JSON.parse(wnbaScheduleRaw) as WnbaScheduleApi
	const cplSchedule = JSON.parse(cplScheduleRaw) as CplScheduleApi
	const mlsSchedule = JSON.parse(mlsScheduleRaw) as MlsScheduleApi
	const nwslSchedule = JSON.parse(nwslScheduleRaw) as NwslScheduleApi
	const pwhlSchedule = JSON.parse(pwhlScheduleRaw) as PwhlScheduleApi
	const cfbSchedule = JSON.parse(cfbScheduleRaw) as CfbScheduleApi
	const worldCupSchedule = JSON.parse(worldCupScheduleRaw) as WorldCupScheduleApi

	let allUrls: string[] = []

	// Add home page
	allUrls.push(`    <url>
        <loc>https://teamcountdown.com</loc>
    </url>`)

	// Add legal and info pages
	allUrls.push(`    <url>
        <loc>https://teamcountdown.com/about</loc>
    </url>`)
	allUrls.push(`    <url>
        <loc>https://teamcountdown.com/contact</loc>
    </url>`)
	allUrls.push(`    <url>
        <loc>https://teamcountdown.com/privacy</loc>
    </url>`)
	allUrls.push(`    <url>
        <loc>https://teamcountdown.com/terms</loc>
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
			: LEAGUE === 'NWSL'
			? uniqBy(
					nwslSchedule.events.flatMap((e) =>
						e.competitions[0].competitors.map(c => c.team)
					),
					'id'
			  ).map(nwslTeamToTeam)
			: LEAGUE === 'PWHL'
			? uniqBy(pwhlSchedule.SiteKit.Scorebar, 'HomeID').map((g) =>
					pwhlTeamToTeam(g.HomeID, g.HomeCode, g.HomeCity, g.HomeNickname, g.HomeLongName)
			  )
			: LEAGUE === 'CFB'
			? uniqBy(
					cfbSchedule.events.flatMap((e) =>
						e.competitions[0].competitors.map((c) => c.team)
					),
					'id'
			  ).map(cfbTeamToTeam)
			: LEAGUE === 'WORLDCUP'
			? (uniqBy(
					worldCupSchedule.Results.flatMap((m) => [m.Home, m.Away]).filter(
						(t): t is NonNullable<typeof t> => t !== null && !!t.IdTeam
					),
					'IdTeam'
			  )
					.map(worldCupTeamToTeam)
					.filter((t): t is Team => t !== null) as Team[])
			: uniqBy(
					nflSchedule.games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)

		// Add league index page
		allUrls.push(`    <url>
        <loc>https://teamcountdown.com/${lowercaseLeague}</loc>
    </url>`)

		// Add season countdown page
		allUrls.push(`    <url>
        <loc>https://teamcountdown.com/${lowercaseLeague}/season</loc>
    </url>`)

		teams.forEach((t) => {
			const teamAbbrev = t.abbreviation.toLowerCase()

			// Team index page (game-level URLs are intentionally excluded —
			// they're ephemeral and indexing them creates churn for Googlebot)
			allUrls.push(`    <url>
        <loc>https://teamcountdown.com/${lowercaseLeague}/${teamAbbrev}</loc>
    </url>`)
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
