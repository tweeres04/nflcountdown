import { defer, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { RouteErrorBoundary } from '~/components/route-error-boundary'

import { addHours, isFuture } from 'date-fns'
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
	params: { league, teamAbbrev },
}: LoaderFunctionArgs) {
	const { LEAGUE, teams, team, games } = await getTeamAndGames(
		league,
		teamAbbrev
	)

	const nextGame = games.find(
		(g: Game) => g.time && isFuture(addHours(g.time, 3))
	)

	// Deferred AI preview generation
	const gamePreviewPromise =
		process.env.GOOGLE_AI_API_KEY &&
		nextGame &&
		nextGame.homeTeam &&
		nextGame.awayTeam
			? getCachedGamePreview(LEAGUE, nextGame, team)
			: Promise.resolve(null)

	// Get suggested games (other teams' games happening now/soon)
	const suggestedGames = nextGame
		? await getSuggestedGames(LEAGUE, nextGame.id, team.id)
		: []

	const breadcrumbItems = [
		{ label: 'Team Countdown', href: '/' },
		{ label: LEAGUE, href: `/${LEAGUE.toLowerCase()}` },
		{ label: team.fullName }, // No href = current page
	]

	// Generate affiliate links (deferred)
	const affiliateLinksPromise =
		LEAGUE !== 'CPL'
			? getAffiliateLinks(team, LEAGUE, nextGame).catch(() => null)
			: Promise.resolve(null)

	return defer({
		LEAGUE,
		teams,
		team,
		games,
		nextGame, // Pass to meta for SportsEvent schema on team pages
		gamePreview: gamePreviewPromise,
		suggestedGames,
		breadcrumbItems,
		affiliateLinks: affiliateLinksPromise,
	})
}

export function ErrorBoundary() {
	return (
		<RouteErrorBoundary
			notFoundTitle="Team not found"
			notFoundMessage="We couldn't find that team. Try picking one from the list."
			genericMessage="We hit an unexpected error. Try refreshing, or pick a different team."
		/>
	)
}

export default function TeamCountdown() {
	const {
		teams,
		team,
		games,
		nextGame,
		gamePreview,
		suggestedGames,
		breadcrumbItems,
		affiliateLinks,
	} = useLoaderData<typeof loader>()

	return (
		<>
			<Countdown
				pageTitle={`${team.fullName} Countdown`}
				team={team}
				teams={teams}
				games={games}
				game={nextGame}
				gamePreview={gamePreview}
				isTeamPage={true}
				breadcrumbItems={breadcrumbItems}
				suggestedGames={suggestedGames}
				affiliateLinks={affiliateLinks}
			/>
			<Footer dark />
		</>
	)
}
