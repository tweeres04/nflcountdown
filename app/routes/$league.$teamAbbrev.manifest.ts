import { json, LoaderFunctionArgs } from '@remix-run/node'
import { uniqBy } from 'lodash-es'
import mlbTeams from '../../mlb_teams.json'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { nhlTeamToTeam } from '~/lib/nhlGameToGame'
import { wnbaTeamToTeam } from '~/lib/wnbaGameToGame'
import { cplTeamToTeam } from '~/lib/cplGameToGame'
import { readFile } from 'node:fs/promises'
import { NbaScheduleApi, NflScheduleApi, NhlScheduleApi, WnbaScheduleApi, CplScheduleApi, Team } from '~/lib/types'

export async function loader({
	params: { league, teamAbbrev },
}: LoaderFunctionArgs) {
	const LEAGUE = league!.toUpperCase()

	const scheduleFile =
		LEAGUE === 'NBA'
			? 'data/nba_schedule.json'
			: LEAGUE === 'MLB'
			? 'data/mlb_schedule.json'
			: LEAGUE === 'NHL'
			? 'data/nhl_schedule.json'
			: LEAGUE === 'WNBA'
			? 'data/wnba_schedule.json'
			: LEAGUE === 'CPL'
			? 'data/cpl_schedule.json'
			: 'data/nfl_schedule.json'

	const scheduleRaw = await readFile(scheduleFile, 'utf-8')
	const scheduleParsed = JSON.parse(scheduleRaw)

	const teams: Team[] =
		LEAGUE === 'MLB'
			? mlbTeams.teams.map(mlbTeamToTeam)
			: LEAGUE === 'NBA'
			? uniqBy(
					(scheduleParsed as NbaScheduleApi).leagueSchedule.gameDates
						.flatMap((gd) => gd.games)
						.map((g) => g.homeTeam),
					'teamId'
			  )
					.filter((t) => t.teamId > 0)
					.map(nbaTeamToTeam)
			: LEAGUE === 'NHL'
			? uniqBy(
					(scheduleParsed as NhlScheduleApi).games.map((g) => g.homeTeam),
					'id'
			  ).map(nhlTeamToTeam)
			: LEAGUE === 'WNBA'
			? uniqBy(
					(scheduleParsed as WnbaScheduleApi).leagueSchedule.gameDates
						.flatMap((gd) => gd.games)
						.map((g) => g.homeTeam),
					'teamId'
			  )
					.filter((t) => t.teamId > 0)
					.map(wnbaTeamToTeam)
			: LEAGUE === 'CPL'
			? uniqBy(
					(scheduleParsed as CplScheduleApi).matches.flatMap((m) => [m.home, m.away]),
					'teamId'
			  ).map(cplTeamToTeam)
			: uniqBy(
					(scheduleParsed as NflScheduleApi).games.map((g) => g.homeTeam),
					'id'
			  ).map(nflTeamToTeam)

	const lowercaseAbbreviation = teamAbbrev?.toLowerCase()

	const team = teams.find(
		(t) => t.abbreviation.toLowerCase() === teamAbbrev?.toLowerCase()
	)

	if (!team) {
		throw new Response(null, { status: 404 })
	}

	// Determine icon size based on league
	const iconSize = LEAGUE === 'WNBA' ? '500x500' : '512x512'

	return json({
		name: `${team.fullName} Countdown`,
		short_name: team.nickName,
		icons: [
			{
				src: `/logos/${
					LEAGUE === 'NFL' ? '' : `${LEAGUE?.toLowerCase()}/`
				}${lowercaseAbbreviation}.png`,
				sizes: iconSize,
				type: 'image/png',
			},
		],
		start_url: `/${league?.toLowerCase()}/${lowercaseAbbreviation}/`,
		display: 'standalone',
		theme_color: team.primaryColor,
		background_color: team.primaryColor,
	})
}
