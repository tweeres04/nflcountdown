import { json, LoaderFunctionArgs } from '@remix-run/node'
import schedule from '../../nfl_schedule.json'
import { MetaFunction, useLoaderData } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import countdown from '../external/countdown'
import { uniqBy, orderBy } from 'lodash-es'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

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
	let teams = uniqBy(
		schedule.games.map((g) => g.homeTeam),
		'id'
	)
	teams = orderBy(teams, 'fullName')

	const team = teams.find(
		(t) => t.abbreviation.toLowerCase() === teamAbbrev?.toLowerCase()
	)

	if (!team) {
		throw new Response(null, { status: 404 })
	}

	const games = schedule.games.filter(
		(g) => g.homeTeam.id === team.id || g.awayTeam.id === team.id
	)

	return json({ teams, team, games })
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
	const { teams, team, games } = useLoaderData<typeof loader>()
	const lowercaseAbbreviation = team.abbreviation.toLowerCase()
	const gradientClass = `bg-gradient-to-b from-${lowercaseAbbreviation} to-${lowercaseAbbreviation}-secondary`
	const nextGame = games[0]

	return (
		<div
			className={`font-sans text-white min-h-[100vh] bg-fixed ${gradientClass}`}
		>
			<div className={`p-4 max-w-[500px] lg:max-w-[750px] mx-auto`}>
				<div className="flex gap-10">
					<h1 className="text-2xl grow">{team.fullName} Countdown</h1>
					<DropdownMenu>
						<DropdownMenuTrigger>Teams</DropdownMenuTrigger>
						<DropdownMenuContent>
							{teams.map((t) => (
								<DropdownMenuItem asChild>
									<a
										href={`/${t.abbreviation.toLowerCase()}`}
										className={`text-white bg-${lowercaseAbbreviation} hover:bg-${lowercaseAbbreviation} hover:text-white rounded-none`}
									>
										{t.fullName}
									</a>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<img
					src={`/logos/${lowercaseAbbreviation}.svg`}
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
					className="mx-auto border border-white px-5 mt-8 flex items-center gap-1"
					onClick={() => {
						setShowFullSchedule((value) => !value)
					}}
				>
					{showFullSchedule ? 'Hide full schedule' : 'Show full schedule'}{' '}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
						/>
					</svg>
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
		</div>
	)
}
