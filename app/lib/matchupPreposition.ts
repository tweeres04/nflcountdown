import type { Game } from './types'

/**
 * "vs" when the team hosts, "at" when it visits — from the perspective of
 * whichever team's page is being viewed.
 *
 * Saying "vs" for an away game claims the wrong venue, so anywhere a matchup
 * is written as "<team> ___ <opponent>" should go through here rather than
 * hardcoding a word.
 *
 * Neutral-site games get "vs": nobody is hosting, so "at" would name the wrong
 * city (the 49ers play the Rams in Melbourne, not in Los Angeles). This is the
 * usage bowl games and World Cup fixtures already follow.
 */
export function matchupPreposition(game: Game, teamAbbreviation: string) {
	if (game.neutralSite) {
		return 'vs'
	}

	return game.homeTeam?.abbreviation === teamAbbreviation ? 'vs' : 'at'
}
