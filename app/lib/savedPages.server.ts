import { and, asc, eq } from 'drizzle-orm'
import { addHours, isFuture } from 'date-fns'
import { db } from './db.server'
import { savedPages } from './schema.server'
import { LEAGUES, teamLogo } from './leagues'
import { getTeamAndGames } from './getTeamAndGames'
import { getSuggestedGames } from './getSuggestedGames'
import { getSeasonStartDate } from './getSeasonStartDate'
import { getGameSlug } from './getGameSlug'
import { matchupPreposition } from './matchupPreposition'
import { getLeagueDisplayName } from './schema-helpers'
import { Game } from './types'

interface ParsedPagePath {
	league: string
	teamAbbrev?: string
	gameSlug?: string
	isSeasonPage?: boolean
}

// Countdown pages look like /league, /league/season, /league/team, or
// /league/team/game-slug
const PAGE_PATH_PATTERN = /^\/[a-z0-9-]+(?:\/[a-z0-9-]+){0,2}$/

export function parseSavablePath(path: string): ParsedPagePath | null {
	if (!PAGE_PATH_PATTERN.test(path)) return null
	const [league, teamAbbrev, gameSlug] = path.slice(1).split('/')
	if (!LEAGUES.includes(league.toUpperCase())) return null
	if (teamAbbrev === 'season') {
		return gameSlug ? null : { league, isSeasonPage: true }
	}
	return { league, teamAbbrev, gameSlug }
}

export async function getSavedPaths(userId: number) {
	const rows = await db.query.savedPages.findMany({
		where: eq(savedPages.userId, userId),
		columns: { path: true },
	})
	return rows.map((row) => row.path)
}

export async function savePage(userId: number, path: string) {
	await db
		.insert(savedPages)
		.values({ userId, path })
		.onConflictDoNothing()
}

// Saves the page a signed-out user tried to save before they were sent to
// signup/login. The path rides along as a hidden form input.
export async function applyPendingSave(userId: number, formData: FormData) {
	const save = formData.get('save')
	if (typeof save !== 'string') return
	const path = save.toLowerCase()
	if (parseSavablePath(path)) {
		await savePage(userId, path)
	}
}

export async function unsavePage(userId: number, path: string) {
	await db
		.delete(savedPages)
		.where(and(eq(savedPages.userId, userId), eq(savedPages.path, path)))
}

export interface SavedPageData {
	path: string
	title: string
	logo: string
	gameTime: string | null
}

export async function getSavedPagesData(
	userId: number
): Promise<SavedPageData[]> {
	const rows = await db.query.savedPages.findMany({
		where: eq(savedPages.userId, userId),
		orderBy: asc(savedPages.createdAt),
	})
	const results = await Promise.all(
		rows.map((row) =>
			// Skip pages that no longer resolve (team or league removed)
			resolveSavedPage(row.path).catch(() => null)
		)
	)
	return results
		.filter((r): r is SavedPageData => r !== null)
		.sort((a, b) => {
			// Soonest game first; pages with no upcoming game last. Stable
			// sort keeps ties in saved order (the createdAt query order).
			if (a.gameTime === null) return b.gameTime === null ? 0 : 1
			if (b.gameTime === null) return -1
			return new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime()
		})
}

async function resolveSavedPage(path: string): Promise<SavedPageData> {
	const parsed = parseSavablePath(path)
	if (!parsed) throw new Error(`Unparsable saved page path: ${path}`)
	const LEAGUE = parsed.league.toUpperCase()

	if (!parsed.teamAbbrev || parsed.isSeasonPage) {
		const leagueLabel = getLeagueDisplayName(LEAGUE)
		if (parsed.isSeasonPage) {
			const { date } = await getSeasonStartDate(LEAGUE)
			return {
				path,
				title: `${leagueLabel} season`,
				logo: `/logos/${parsed.league}.png`,
				gameTime: date.toISOString(),
			}
		}
		// League page: soonest upcoming game, or the season opener
		const [upcomingGames, seasonResult] = await Promise.all([
			getSuggestedGames(LEAGUE, undefined, undefined, 1),
			getSeasonStartDate(LEAGUE),
		])
		return {
			path,
			title: leagueLabel,
			logo: `/logos/${parsed.league}.png`,
			gameTime: upcomingGames[0]?.time ?? seasonResult.date.toISOString(),
		}
	}

	const { team, games } = await getTeamAndGames(parsed.league, parsed.teamAbbrev)
	const logo = teamLogo(LEAGUE, team.abbreviation.toLowerCase())

	if (parsed.gameSlug) {
		const game = games.find(
			(g: Game) =>
				g.time && getGameSlug(g, team.abbreviation) === parsed.gameSlug
		)
		if (game) {
			const opponent =
				game.homeTeam?.abbreviation === team.abbreviation
					? game.awayTeam
					: game.homeTeam
			return {
				path,
				title: `${team.fullName} ${matchupPreposition(
					game,
					team.abbreviation
				)} ${opponent?.fullName ?? 'TBD'}`,
				logo,
				gameTime: game.time,
			}
		}
		// The game is gone from the schedule; fall through to the team's next game
	}

	const nextGame = games.find(
		(g: Game) => g.time && isFuture(addHours(g.time, 3))
	)
	return {
		path,
		title: team.fullName,
		logo,
		gameTime: nextGame?.time ?? null,
	}
}
