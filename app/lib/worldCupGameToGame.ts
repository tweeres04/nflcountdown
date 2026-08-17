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

/**
 * FIFA tournaments assign a nominal home side to every fixture, but only the
 * host nations actually play at home. Compare the stadium's country to the home
 * team's: if they differ, both sides are visitors.
 *
 * Returns null when either country is missing — knockout fixtures have no teams
 * assigned yet, and "unknown" must not read as "not neutral".
 */
export function isNeutralVenue(match: WorldCupMatchApi) {
	const stadiumCountry = match.Stadium?.IdCountry
	const homeCountry = match.Home?.IdCountry

	if (!stadiumCountry || !homeCountry) {
		return null
	}

	return stadiumCountry !== homeCountry
}

export function worldCupGameToGame(match: WorldCupMatchApi): Game {
	return {
		id: match.IdMatch,
		time: match.Date,
		homeTeam: match.Home ? worldCupTeamToTeam(match.Home) : null,
		awayTeam: match.Away ? worldCupTeamToTeam(match.Away) : null,
		startTimeTbd: false,
		neutralSite: isNeutralVenue(match),
	}
}
