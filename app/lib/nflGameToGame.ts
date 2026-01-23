import { Team, Game, NflTeamApi, NflScheduleApi } from './types'

export function nflTeamToTeam(nflTeam: NflTeamApi): Team {
	return {
		id: nflTeam.id,
		nickName: nflTeam.nickName,
		fullName: nflTeam.fullName,
		abbreviation: nflTeam.abbreviation,
		primaryColor: nflTeam.primaryColor || '#013369',
		secondaryColor: nflTeam.secondaryColor || '#ffffff',
	}
}

export function nflGameToGame(nflGame: NflScheduleApi['games'][0]): Game {
	return {
		id: nflGame.id,
		time: nflGame.time,
		homeTeam: nflTeamToTeam(nflGame.homeTeam),
		awayTeam: nflTeamToTeam(nflGame.awayTeam),
		startTimeTbd: false,
	}
}
