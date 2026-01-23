import { json, LoaderFunctionArgs } from '@remix-run/node'
import { uniqBy } from 'lodash-es'
import mlbTeams from '../../mlb_teams.json'
import { nbaTeamToTeam } from '~/lib/nbaGameToGame'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'
import { nflTeamToTeam } from '~/lib/nflGameToGame'
import { readFile } from 'node:fs/promises'
import { NbaScheduleApi, NflScheduleApi, Team } from '~/lib/types'

export async function loader({
	params: { league, teamAbbrev },
}: LoaderFunctionArgs) {
	const LEAGUE = league!.toUpperCase()

	const scheduleFile =
		LEAGUE === 'NBA'
			? 'data/nba_schedule.json'
			: LEAGUE === 'MLB'
			? 'data/mlb_schedule.json'
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

	return json({
		name: `${team.fullName} Countdown`,
		short_name: team.nickName,
		icons: [
			{
				src: `/logos/${
					LEAGUE === 'NFL' ? '' : `${LEAGUE?.toLowerCase()}/`
				}${lowercaseAbbreviation}.png`,
				sizes: 'any',
			},
		],
		start_url: `/${league?.toLowerCase()}/${lowercaseAbbreviation}/`,
		display: 'standalone',
		theme_color: team.primaryColor,
		background_color: team.primaryColor,
	})
}
