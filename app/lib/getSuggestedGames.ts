import { differenceInMilliseconds } from 'date-fns'
import { getAllGames } from './getAllGames'
import { Game } from './types'

export async function getSuggestedGames(
	league: string,
	excludeGameId?: string,
	excludeTeamId?: number | string,
	limit: number = 3
): Promise<Game[]> {
	const LEAGUE = league.toUpperCase()
	const now = new Date()

	// Load all games for the league
	const allGames = await getAllGames(LEAGUE)

	// Filter and sort games
	const suggestedGames = allGames
		.filter((g) => {
			// Skip current game (if provided)
			if (excludeGameId && g.id === excludeGameId) return false

			// Skip games without full data
			if (!g.time || !g.homeTeam || !g.awayTeam) return false

			// Skip games involving the excluded team (if provided)
			if (excludeTeamId) {
				if (
					g.homeTeam.id === excludeTeamId ||
					g.awayTeam.id === excludeTeamId
				) {
					return false
				}
			}

			const gameTime = new Date(g.time)

			// Skip completed and in progress games
			if (now > gameTime) return false

			// Include games within next 7 days
			const daysUntilGame =
				differenceInMilliseconds(gameTime, now) / (1000 * 60 * 60 * 24)
			return daysUntilGame < 7
		})
		.sort((a, b) => {
			const aTime = new Date(a.time!)
			const bTime = new Date(b.time!)

			// Then sort by start time (earliest first)
			return aTime.getTime() - bTime.getTime()
		})
		.slice(0, limit)

	return suggestedGames
}
