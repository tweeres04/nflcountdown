import { json, LoaderFunctionArgs } from '@remix-run/node'
import { uniqBy } from 'lodash-es'
import schedule from '../../nfl_schedule.json'

export function loader({ params: { teamAbbrev } }: LoaderFunctionArgs) {
	let teams = uniqBy(
		schedule.games.map((g) => g.homeTeam),
		'id'
	)

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
				src: `/logos/${lowercaseAbbreviation}.png`,
				sizes: 'any',
			},
		],
		start_url: `/${lowercaseAbbreviation}/`,
		display: 'standalone',
		theme_color: team.primaryColor,
		background_color: team.primaryColor,
	})
}
