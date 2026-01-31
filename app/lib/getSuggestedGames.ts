import { addHours, differenceInMilliseconds } from 'date-fns'
import { getAllGames } from './getAllGames'
import { Game } from './types'

// Game duration by league (in hours)
const GAME_DURATION_HOURS: Record<string, number> = {
	NFL: 3,
	NBA: 3,
	MLB: 3,
}

export async function getSuggestedGames(
	league: string,
	excludeGameId?: string,
	excludeTeamId?: number | string,
	limit: number = 3
): Promise<Game[]> {
	const LEAGUE = league.toUpperCase()
	const now = new Date()
	const gameDuration = GAME_DURATION_HOURS[LEAGUE] || 3

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
			const gameEndTime = addHours(gameTime, gameDuration)

			// Skip completed games
			if (now > gameEndTime) return false

			// Include games within next 7 days
			const daysUntilGame =
				differenceInMilliseconds(gameTime, now) / (1000 * 60 * 60 * 24)
			return daysUntilGame < 7
		})
		.sort((a, b) => {
			const aTime = new Date(a.time!)
			const bTime = new Date(b.time!)
			const aEndTime = addHours(aTime, gameDuration)
			const bEndTime = addHours(bTime, gameDuration)

			// In progress games first
			const aInProgress = now >= aTime && now <= aEndTime
			const bInProgress = now >= bTime && now <= bEndTime

			if (aInProgress && !bInProgress) return -1
			if (!aInProgress && bInProgress) return 1

			// Then sort by start time (earliest first)
			return aTime.getTime() - bTime.getTime()
		})
		.slice(0, limit)

	return suggestedGames
}
