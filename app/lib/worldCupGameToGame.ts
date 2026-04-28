import worldCupColors from '../../worldcup_colors.json'
import { Team, Game, WorldCupTeamApi, WorldCupMatchApi } from './types'

export function worldCupTeamToTeam(apiTeam: WorldCupTeamApi): Team | null {
	if (!apiTeam.IdTeam || !apiTeam.Abbreviation) {
		return null
	}

	const colorData = worldCupColors.find(
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

export function worldCupGameToGame(match: WorldCupMatchApi): Game {
	return {
		id: match.IdMatch,
		time: match.Date,
		homeTeam: match.Home ? worldCupTeamToTeam(match.Home) : null,
		awayTeam: match.Away ? worldCupTeamToTeam(match.Away) : null,
		startTimeTbd: false,
	}
}
