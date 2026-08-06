import mlbTeams from '../../mlb_teams.json'
import { uniqBy } from 'lodash-es'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplTeamToTeam } from '~/lib/cplGameToGame'
import { cflTeamToTeam } from '~/lib/cflGameToGame'
import { nslTeamToTeam } from '~/lib/nslGameToGame'
import { ceblTeamToTeam } from '~/lib/ceblGameToGame'
import { mlsTeamToTeam } from '~/lib/mlsGameToGame'
import { nwslTeamToTeam } from '~/lib/nwslGameToGame'
import { pwhlTeamToTeam } from '~/lib/pwhlGameToGame'
import { cfbTeamToTeam } from '~/lib/cfbGameToGame'
import { worldCupTeamToTeam } from '~/lib/worldCupGameToGame'
import { wwcTeamToTeam } from '~/lib/wwcGameToGame'
import { readFile } from 'node:fs/promises'
import { getAllGames } from '~/lib/getAllGames'
import { getLastChangeTimes } from '~/lib/sitemap-lastmod'
import { NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, CplScheduleApi, CflScheduleApi, NslScheduleApi, CeblScheduleApi, MlsScheduleApi, NwslScheduleApi, PwhlScheduleApi, CfbScheduleApi, WorldCupScheduleApi, WwcScheduleApi, WwcTeamApi, Team } from '~/lib/types'

// Teams/leagues with no games played yet get no lastmod — we don't have a
// trustworthy change date for them, and omitting is more honest than guessing.
function urlXml(loc: string, lastmod?: number | null) {
	return `    <url>
        <loc>${loc}</loc>${lastmod ? `\n        <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}
    </url>`
}

export async function loader() {
	const leagues = ['NFL', 'MLB', 'NBA', 'NHL', 'WNBA', 'CEBL', 'CPL', 'CFL', 'NSL', 'MLS', 'NWSL', 'PWHL', 'CFB', 'WORLDCUP', 'WWC']

	const [nflScheduleRaw, nbaScheduleRaw, nhlScheduleRaw, wnbaScheduleRaw, ceblScheduleRaw, cplScheduleRaw, cflScheduleRaw, nslScheduleRaw, mlsScheduleRaw, nwslScheduleRaw, pwhlScheduleRaw, cfbScheduleRaw, worldCupScheduleRaw, wwcScheduleRaw] = await Promise.all([
		readFile('data/nfl_schedule.json', 'utf-8'),
		readFile('data/nba_schedule.json', 'utf-8'),
		readFile('data/nhl_schedule.json', 'utf-8'),
		readFile('data/wnba_schedule.json', 'utf-8'),
		readFile('data/cebl_schedule.json', 'utf-8'),
		readFile('data/cpl_schedule.json', 'utf-8'),
		readFile('data/cfl_schedule.json', 'utf-8'),
		readFile('data/nsl_schedule.json', 'utf-8'),
		readFile('data/mls_schedule.json', 'utf-8'),
		readFile('data/nwsl_schedule.json', 'utf-8'),
		readFile('data/pwhl_schedule.json', 'utf-8'),
		readFile('data/cfb_schedule.json', 'utf-8'),
		readFile('data/worldcup_schedule.json', 'utf-8'),
		readFile('data/wwc_schedule.json', 'utf-8'),
	])

	const nflSchedule = JSON.parse(nflScheduleRaw) as NflScheduleApi
	const nbaSchedule = JSON.parse(nbaScheduleRaw) as NbaScheduleApi
	const nhlSchedule = JSON.parse(nhlScheduleRaw) as NhlScheduleApi
	const wnbaSchedule = JSON.parse(wnbaScheduleRaw) as WnbaScheduleApi
	const ceblSchedule = JSON.parse(ceblScheduleRaw) as CeblScheduleApi
	const cplSchedule = JSON.parse(cplScheduleRaw) as CplScheduleApi
	const cflSchedule = JSON.parse(cflScheduleRaw) as CflScheduleApi
	const nslSchedule = JSON.parse(nslScheduleRaw) as NslScheduleApi
	const mlsSchedule = JSON.parse(mlsScheduleRaw) as MlsScheduleApi
	const nwslSchedule = JSON.parse(nwslScheduleRaw) as NwslScheduleApi
	const pwhlSchedule = JSON.parse(pwhlScheduleRaw) as PwhlScheduleApi
	const cfbSchedule = JSON.parse(cfbScheduleRaw) as CfbScheduleApi
	const worldCupSchedule = JSON.parse(worldCupScheduleRaw) as WorldCupScheduleApi
	const wwcSchedule = JSON.parse(wwcScheduleRaw) as WwcScheduleApi

	const now = Date.now()
	let allUrls: string[] = []

	// Home page + legal/info pages are static directories — no lastmod.
	allUrls.push(urlXml('https://teamcountdown.com'))
	allUrls.push(urlXml('https://teamcountdown.com/about'))
	allUrls.push(urlXml('https://teamcountdown.com/contact'))
	allUrls.push(urlXml('https://teamcountdown.com/privacy'))
	allUrls.push(urlXml('https://teamcountdown.com/terms'))

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
				: LEAGUE === 'CFL'
				? uniqBy(
						cflSchedule.rounds
							.flatMap((r) => r.tournaments)
							.map((g) => g.homeSquad),
						'id'
				  ).map(cflTeamToTeam)
				: LEAGUE === 'NSL'
				? uniqBy(
						nslSchedule.events.flatMap((e) =>
							e.competitions[0].competitors.map((c) => c.team)
						),
						'id'
				  ).map(nslTeamToTeam)
				: LEAGUE === 'CEBL'
				? uniqBy(ceblSchedule.games, 'home_team_id').map((g) =>
						ceblTeamToTeam(g.home_team_id, g.home_team_name)
				  )
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
			: LEAGUE === 'WWC'
			? (uniqBy(
					wwcSchedule.Results.flatMap((m) => [m.Home, m.Away]).filter(
						(t): t is WwcTeamApi => t !== null && !!t.IdTeam
					),
					'IdTeam'
			  )
					.map(wwcTeamToTeam)
					.filter((t): t is Team => t !== null) as Team[])
			: uniqBy(
					nflSchedule.games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)

		const { byTeam, leagueMax } = getLastChangeTimes(
			await getAllGames(LEAGUE),
			now
		)

		// League index + season pages reflect the league's latest played game
		allUrls.push(urlXml(`https://teamcountdown.com/${lowercaseLeague}`, leagueMax))
		allUrls.push(urlXml(`https://teamcountdown.com/${lowercaseLeague}/season`, leagueMax))

		teams.forEach((t) => {
			const teamAbbrev = t.abbreviation.toLowerCase()

			// Team index page (game-level URLs are intentionally excluded —
			// they're ephemeral and indexing them creates churn for Googlebot)
			allUrls.push(
				urlXml(
					`https://teamcountdown.com/${lowercaseLeague}/${teamAbbrev}`,
					byTeam.get(teamAbbrev)
				)
			)
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
