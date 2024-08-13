import { json, type MetaFunction } from '@remix-run/node'
import { uniqBy, orderBy } from 'lodash-es'
import schedule from '../../nfl_schedule.json'
import TeamsDropdown from '~/components/ui/teams-dropdown'
import { useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { useContext } from 'react'
import { LeagueContext } from '~/lib/league-context'
import mlbTeams from '../../mlb_teams.json'
import { mlbTeamToTeam } from '~/lib/mlbGameToGame'

export const meta: MetaFunction = ({ data }) => {
	const LEAGUE = data.LEAGUE

	const title = `When is the next ${LEAGUE} game? - ${LEAGUE} Countdown`
	const description = `The fastest and prettiest way to check the next ${LEAGUE} game. Launches instantly from your home screen.`
	return [
		{ title },
		{
			name: 'description',
			content: description,
		},
		{ name: 'og:title', content: title },
		{ name: 'og:type', content: 'website' },
		{
			name: 'og:url',
			content: `https://${LEAGUE.toLowerCase()}countdown.tweeres.ca`,
		},
		{
			name: 'og:image',
			content: `https://${LEAGUE.toLowerCase()}countdown.tweeres.ca/og.png`,
		},
		{
			name: 'og:description',
			content: description,
		},
		{ name: 'og:site_name', content: `${LEAGUE} Countdown` },
	]
}

export async function loader() {
	const LEAGUE = process.env.LEAGUE ?? 'NFL'
	let teams =
		LEAGUE === 'MLB'
			? mlbTeams.teams.map(mlbTeamToTeam)
			: uniqBy(
					schedule.games.map((g) => g.homeTeam),
					'id'
			  )
	teams = orderBy(teams, 'fullName')

	return json({ LEAGUE, teams })
}

export default function Index() {
	const { LEAGUE, teams } = useLoaderData<typeof loader>()
	return (
		<>
			<div className="flex flex-col min-h-screen md:h-auto">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-12 min-h-[600px] grow">
					<h1 className="text-3xl">{LEAGUE} Countdown</h1>
					<div className="flex flex-col gap-10">
						<div className="space-y-5">
							<div className="space-y-3">
								<h2 className="text-2xl">
									Get pumped for your team's next game!
								</h2>
								<p>
									A fast, pretty web app that counts down to the next {LEAGUE}{' '}
									game. Saves to your home screen for immediate access.
								</p>
							</div>
							<TeamsDropdown teams={teams}>
								<Button className="border-stone-900">Pick your team</Button>
							</TeamsDropdown>
						</div>
						<div>
							<div className="space-y-1 max-w-[400px] mx-auto">
								<img
									src="/hero.png"
									alt="Screenshot of Kansas City Chiefs countdown in action."
									className="rounded-sm"
								/>
								<p className="text-sm">
									Screenshot of Kansas City Chiefs countdown in action.
								</p>
							</div>
						</div>
					</div>
				</div>
				<footer className="bg-stone-200">
					<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto text-sm">
						<p>
							<a href="https://tweeres.ca">By Tyler Weeres</a>
						</p>
						<p>
							{LEAGUE === 'MLB' ? (
								<a
									href="https://www.flaticon.com/free-icons/baseball"
									title="baseball icons"
								>
									Baseball icons created by Freepik - Flaticon
								</a>
							) : (
								<a
									href="https://www.flaticon.com/free-icons/american-football"
									title="american football icons"
								>
									American football icon created by Smashicons - Flaticon
								</a>
							)}
						</p>
					</div>
				</footer>
			</div>
		</>
	)
}
