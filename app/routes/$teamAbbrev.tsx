import { json, LoaderFunctionArgs } from '@remix-run/node'
import schedule from '../../nfl_schedule.json'
import { MetaFunction, useLoaderData } from '@remix-run/react'
import countdown from 'countdown'
import { useEffect, useRef, useState } from 'react'

export function meta(): MetaFunction {
	return [
		{ title: 'When is the next NFL game? - NFL Countdown' },
		{
			name: 'description',
			content:
				'The fastest and prettiest way to check the next NFL game. Launches instantly from your home screen.',
		},
	]
}

export async function loader({ params: { teamAbbrev } }: LoaderFunctionArgs) {
	const teams = [...new Set(schedule.games.map((g) => g.homeTeam))]

	const team = teams.find(
		(t) => t.abbreviation.toLowerCase() === teamAbbrev?.toLowerCase()
	)

	if (!team) {
		throw new Response(null, { status: 404 })
	}

	const games = schedule.games.filter(
		(g) => g.homeTeam.id === team.id || g.awayTeam.id === team.id
	)

	return json({ team, games })
}

function useUpdateTime() {
	const [, setCurrentTime] = useState(new Date())
	const intervalHandleRef = useRef<NodeJS.Timeout>()

	useEffect(() => {
		intervalHandleRef.current = setInterval(() => {
			setCurrentTime(new Date())
		}, 1000)

		return () => {
			clearInterval(intervalHandleRef.current)
		}
	}, [])
}

export default function Countdown() {
	useUpdateTime()
	const [showFullSchedule, setShowFullSchedule] = useState(false)
	const { team, games } = useLoaderData<typeof loader>()
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const gradientClass = `bg-gradient-to-b from-${lowercaseAbbreviation} to-${lowercaseAbbreviation}-secondary`
	const nextGame = games[0]

	return (
		<div
			className={`font-sans p-4 max-w-[500px] lg:max-w-[750px] mx-auto text-white min-h-[100vh] bg-fixed ${gradientClass}`}
		>
			<h1 className="text-2xl">{team.fullName} Countdown</h1>
			<img
				src={team.currentLogo.replace('/{formatInstructions}', '')}
				className="w-[256px] h-[256px] lg:w-[512px] lg:h-[512px] mx-auto"
				alt={`${team.fullName} logo`}
			/>
			<div className="text-center space-y-2">
				{nextGame.time ? (
					<>
						<div className="text-3xl">
							{`${countdown(new Date(nextGame.time)).toString()} till the ${
								team.nickName
							} play next`}
						</div>
						<div>
							<div>
								{new Intl.DateTimeFormat('en-US', {
									month: 'short',
									weekday: 'short',
									day: 'numeric',
									hour: 'numeric',
									minute: 'numeric',
								}).format(new Date(nextGame.time))}
							</div>
							<div className="text-sm">
								vs{' '}
								{nextGame.homeTeam.abbreviation !== team.abbreviation
									? nextGame.homeTeam.fullName
									: nextGame.awayTeam.fullName}
							</div>
						</div>
					</>
				) : (
					<div className="text-3xl">Game time TBD</div>
				)}
			</div>
			<button
				className="block mx-auto border border-white px-5 mt-8"
				onClick={() => {
					setShowFullSchedule((value) => !value)
				}}
			>
				{showFullSchedule ? 'Hide full schedule' : 'Show full schedule'}
			</button>
			{showFullSchedule ? (
				<ul className="space-y-3 mt-8">
					{games.map((g) => (
						<li key={g.id}>
							<div className="font-bold text-lg">
								{g.time
									? new Intl.DateTimeFormat('en-US', {
											dateStyle: 'full',
											timeStyle: 'short',
									  }).format(new Date(g.time))
									: 'TBD'}
							</div>{' '}
							{g.homeTeam.abbreviation === team.abbreviation ? 'vs' : 'at'}{' '}
							{g.homeTeam.abbreviation !== team.abbreviation
								? g.homeTeam.fullName
								: g.awayTeam.fullName}
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
