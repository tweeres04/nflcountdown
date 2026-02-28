import { defer, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { RouteErrorBoundary } from '~/components/route-error-boundary'

import { getGameSlug } from '~/lib/getGameSlug'
import Countdown from '~/components/countdown'
import { getTeamAndGames } from '~/lib/getTeamAndGames'
import { generateMeta } from '~/lib/generateMeta'
import { getCachedGamePreview } from '~/lib/gemini-service'
import { getSuggestedGames } from '~/lib/getSuggestedGames'
import { getAffiliateLinks } from '~/lib/cj-service'
import { Game } from '~/lib/types'
import Footer from '~/components/footer'

export { generateMeta as meta }

export async function loader({
	params: { league, teamAbbrev, gameSlug },
}: LoaderFunctionArgs) {
	const { LEAGUE, teams, team, games } = await getTeamAndGames(
		league,
		teamAbbrev
	)

	const currentGame = games.find((g: Game) => {
		if (!g.time) return false
		const expectedSlug = getGameSlug(g, team.abbreviation)
		return expectedSlug === gameSlug
	})

	if (!currentGame) {
		throw new Response(null, { status: 404 })
	}

	// Deferred AI preview generation
	const gamePreviewPromise =
		process.env.GOOGLE_AI_API_KEY &&
		currentGame.homeTeam &&
		currentGame.awayTeam
			? getCachedGamePreview(LEAGUE, currentGame, team)
			: Promise.resolve(null)

	// Get suggested games (other teams' games happening now/soon)
	const suggestedGames = await getSuggestedGames(
		LEAGUE,
		currentGame.id,
		team.id
	)

	const opponent =
		currentGame.homeTeam?.abbreviation === team.abbreviation
			? currentGame.awayTeam?.fullName
			: currentGame.homeTeam?.fullName

	const gameDate = currentGame.time
		? new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
		  }).format(new Date(currentGame.time))
		: ''

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: LEAGUE, href: `/${LEAGUE.toLowerCase()}` },
		{
			label: team.fullName,
			href: `/${LEAGUE.toLowerCase()}/${team.abbreviation.toLowerCase()}`,
		},
		{ label: `vs ${opponent ?? 'TBD'} ${gameDate}` }, // No href = current page
	]

	// Generate affiliate links (deferred) — CPL has no ticket coverage
	const affiliateLinksPromise =
		LEAGUE !== 'CPL'
			? getAffiliateLinks(team, LEAGUE, currentGame).catch(() => null)
			: Promise.resolve(null)

	return defer({
		LEAGUE,
		teams,
		team,
		game: currentGame,
		games,
		gamePreview: gamePreviewPromise,
		suggestedGames,
		breadcrumbItems,
		affiliateLinks: affiliateLinksPromise,
	})
}

export function ErrorBoundary() {
	return (
		<RouteErrorBoundary
			notFoundTitle="Game not found"
			notFoundMessage="We couldn't find that game. It may have been rescheduled or removed."
			genericMessage="We hit an unexpected error. Try refreshing, or go back to your team."
		/>
	)
}

export default function GameCountdown() {
	const {
		teams,
		team,
		game,
		games,
		gamePreview,
		suggestedGames,
		breadcrumbItems,
		affiliateLinks,
	} = useLoaderData<typeof loader>()

	const opposingTeam =
		game.homeTeam?.abbreviation === team.abbreviation
			? game.awayTeam
			: game.homeTeam

	return (
		<>
			<Countdown
				team={team}
				teams={teams}
				games={games}
				game={game}
				gamePreview={gamePreview}
				pageTitle={
					<>
						{team.fullName} vs {opposingTeam?.fullName ?? 'TBD'}
					</>
				}
				breadcrumbItems={breadcrumbItems}
				suggestedGames={suggestedGames}
				affiliateLinks={affiliateLinks}
			/>
			<Footer dark />
		</>
	)
}
