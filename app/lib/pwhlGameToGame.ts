import pwhlColors from '../../pwhl_colors.json'
import { Team, Game, PwhlGameApi } from './types'

export function pwhlTeamToTeam(
	id: string,
	code: string,
	city: string,
	nickname: string,
	longName: string
): Team {
	const colorData = pwhlColors.find((c) => c.abbreviation === code)

	if (!colorData) {
		console.error('No colors found for PWHL team', longName, code)
	}

	return {
		id,
		nickName: nickname,
		fullName: longName,
		abbreviation: code,
		primaryColor: colorData?.color_1 ?? '#350282',
		secondaryColor: colorData?.color_2 ?? '#ffffff',
	}
}

export function pwhlGameToGame(game: PwhlGameApi): Game {
	return {
		id: game.ID,
		time: game.GameDateISO8601,
		homeTeam: pwhlTeamToTeam(
			game.HomeID,
			game.HomeCode,
			game.HomeCity,
			game.HomeNickname,
			game.HomeLongName
		),
		awayTeam: pwhlTeamToTeam(
			game.VisitorID,
			game.VisitorCode,
			game.VisitorCity,
			game.VisitorNickname,
			game.VisitorLongName
		),
		startTimeTbd: false,
		broadcast: null,
	}
}
