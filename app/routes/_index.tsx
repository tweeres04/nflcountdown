import { json, LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { uniqBy, orderBy } from 'lodash-es'
import schedule from '../../nfl_schedule.json'
import TeamsDropdown from '~/components/ui/teams-dropdown'
import { useLoaderData } from '@remix-run/react'

export const meta: MetaFunction = () => {
	const title = 'When is the next NFL game? - NFL Countdown'
	const description =
		'The fastest and prettiest way to check the next NFL game. Launches instantly from your home screen.'
	return [
		{ title },
		{
			name: 'description',
			content: description,
		},
		{ name: 'og:title', content: title },
		{ name: 'og:type', content: 'website' },
		{ name: 'og:url', content: 'https://nflcountdown.tweeres.ca' },
		{ name: 'og:image', content: 'https://nflcountdown.tweeres.ca/og.png' },
		{
			name: 'og:description',
			content: description,
		},
		{ name: 'og:site_name', content: 'NFL Countdown' },
	]
}

export async function loader() {
	let teams = uniqBy(
		schedule.games.map((g) => g.homeTeam),
		'id'
	)
	teams = orderBy(teams, 'fullName')

	return json({ teams })
}

export default function Index() {
	const { teams } = useLoaderData<typeof loader>()
	return (
		<>
			<div className="flex flex-col min-h-screen md:h-auto">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-12 min-h-[600px] grow">
					<h1 className="text-3xl">NFL Countdown</h1>
					<div className="flex flex-col gap-10">
						<div className="space-y-5">
							<div className="space-y-3">
								<h2 className="text-2xl">
									Get pumped for your team's next game!
								</h2>
								<p>
									A fast, pretty web app that counts down to the next NFL game.
									Saves to your home screen for immediate access.
								</p>
							</div>
							<TeamsDropdown teams={teams}>
								<button className="w-full md:w-auto border-2 border-stone-900 px-3 py-2 rounded-sm focus:outline-none">
									Pick your team
								</button>
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
						<a
							href="https://www.flaticon.com/free-icons/american-football"
							title="american football icons"
						>
							American football icon created by Smashicons - Flaticon
						</a>
					</div>
				</footer>
			</div>
		</>
	)
}
