import { Game } from './types'
import { parseISO } from 'date-fns/parseISO'

export function getGameSlug(game: Game, teamAbbrev: string) {
	if (!game.time) return null
	const date = parseISO(game.time)
	const month = date.toLocaleString('default', { month: 'short' }).toLowerCase()
	const day = date.getDate()
	const year = date.getFullYear()
	const opponent =
		game.homeTeam?.abbreviation !== teamAbbrev
			? game.homeTeam?.abbreviation
			: game.awayTeam?.abbreviation
	return opponent
		? `${month}-${day}-${year}-${opponent.toLowerCase()}`
		: `${month}-${day}-${year}`
}
