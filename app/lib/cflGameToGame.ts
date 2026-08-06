import cflColors from '../../cfl_colors.json'
import { Team, Game, CflSquadApi, CflGameApi } from './types'

export function cflTeamToTeam({ id, name, shortName }: CflSquadApi): Team {
	const colorData = cflColors.find((c) => c.abbreviation === shortName)

	if (!colorData) {
		console.error('No colors found for CFL team', name, shortName)
	}

	return {
		id,
		// The colors file also normalizes name styling the feed gets wrong
		// (e.g. "Ottawa RedBlacks" → "Ottawa Redblacks").
		nickName: colorData?.nickname || name.split(' ').slice(-1)[0],
		fullName: colorData?.team || name,
		abbreviation: shortName,
		primaryColor: colorData?.color_1 || '#000',
		secondaryColor: colorData?.color_2 || '#333',
	}
}

export function cflGameToGame(game: CflGameApi): Game {
	return {
		id: String(game.id),
		time: game.date,
		homeTeam: cflTeamToTeam(game.homeSquad),
		awayTeam: cflTeamToTeam(game.awaySquad),
		startTimeTbd: false,
		broadcast: null,
	}
}
