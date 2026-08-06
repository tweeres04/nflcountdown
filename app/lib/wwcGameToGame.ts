import wwcColors from '../../wwc_colors.json'
import { Team, Game, WwcTeamApi, WwcMatchApi } from './types'

export function wwcTeamToTeam(apiTeam: WwcTeamApi): Team | null {
	if (!apiTeam.IdTeam || !apiTeam.Abbreviation) {
		return null
	}

	const colorData = wwcColors.find(
		(c) => c.abbreviation === apiTeam.Abbreviation
	)

	const teamName = apiTeam.TeamName[0]?.Description ?? apiTeam.Abbreviation

	return {
		id: apiTeam.IdTeam,
		nickName: teamName,
		fullName: teamName,
		abbreviation: apiTeam.Abbreviation,
		primaryColor: colorData?.color_1 || '#1A1A1A',
		secondaryColor: colorData?.color_2 || '#333333',
	}
}

export function wwcGameToGame(match: WwcMatchApi): Game {
	return {
		id: match.IdMatch,
		time: match.Date,
		homeTeam: match.Home ? wwcTeamToTeam(match.Home) : null,
		awayTeam: match.Away ? wwcTeamToTeam(match.Away) : null,
		startTimeTbd: false,
	}
}
