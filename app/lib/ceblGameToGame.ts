import ceblColors from '../../cebl_colors.json'
import { Team, Game, CeblGameApi } from './types'

// The CEBL API carries no team abbreviations, so teams join to the colors
// file by team id (stable across seasons per the API's /teams/ endpoint).
export function ceblTeamToTeam(teamId: number, teamName: string): Team {
	const colorData = ceblColors.find((c) => c.teamId === teamId)

	if (!colorData) {
		console.error('No colors found for CEBL team', teamName, teamId)
	}

	return {
		id: teamId,
		nickName: colorData?.nickname || teamName.split(' ').slice(-1)[0],
		fullName: colorData?.team || teamName,
		abbreviation: colorData?.abbreviation || teamName.slice(0, 3).toUpperCase(),
		primaryColor: colorData?.color_1 || '#000',
		secondaryColor: colorData?.color_2 || '#333',
	}
}

export function ceblGameToGame(game: CeblGameApi): Game {
	return {
		id: String(game.id),
		time: game.start_time_utc,
		homeTeam: ceblTeamToTeam(game.home_team_id, game.home_team_name),
		awayTeam: ceblTeamToTeam(game.away_team_id, game.away_team_name),
		startTimeTbd: false,
		broadcast: null,
	}
}
