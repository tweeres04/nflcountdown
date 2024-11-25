import { Game } from './types'

export function getGameSlug(game: Game, teamAbbrev: string) {
	if (!game.time) return null
	const date = new Date(game.time)
	const month = date.toLocaleString('default', { month: 'short' }).toLowerCase()
	const day = date.getDate()
	const year = date.getFullYear()
	const opponent =
		game.homeTeam.abbreviation !== teamAbbrev
			? game.homeTeam.abbreviation
			: game.awayTeam.abbreviation
	return `${month}-${day}-${year}-${opponent.toLowerCase()}`
}
