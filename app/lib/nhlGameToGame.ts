import nhlColors from '../../nhl_colors.json'
import { Team, Game, NhlTeamApi, NhlGameApi } from './types'

export function nhlTeamToTeam(nhlTeam: NhlTeamApi): Team {
	const color = nhlColors.find(
		(c) => c.abbreviation === nhlTeam.abbrev
	) as (typeof nhlColors)[0]

	if (!color) {
		console.error('No colors found for NHL team', nhlTeam.placeName.default, nhlTeam.commonName.default)
	}

	return {
		id: nhlTeam.id,
		nickName: nhlTeam.commonName.default,
		fullName: `${nhlTeam.placeName.default} ${nhlTeam.commonName.default}`,
		abbreviation: nhlTeam.abbrev,
		primaryColor: color?.color_1 || '#000',
		secondaryColor: color?.color_2 || '#fff',
	}
}

export function nhlGameToGame(nhlGame: NhlGameApi): Game {
	return {
		id: String(nhlGame.id),
		time: nhlGame.startTimeUTC,
		homeTeam: nhlTeamToTeam(nhlGame.homeTeam),
		awayTeam: nhlTeamToTeam(nhlGame.awayTeam),
		startTimeTbd: false,
	}
}
