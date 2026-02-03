export type Team = {
	id: number | string
	nickName: string
	fullName: string
	abbreviation: string
	primaryColor: string
	secondaryColor: string
}

type IsoDateString = string

export type Game = {
	id: string
	time: IsoDateString | null
	homeTeam: Team | null
	awayTeam: Team | null
	startTimeTbd: boolean | null
	broadcast?: string | null
}

// API Types for raw data parsing
export interface NflTeamApi {
	id: string
	fullName: string
	nickName: string
	abbreviation: string
	primaryColor?: string
	secondaryColor?: string
}

export interface NflScheduleApi {
	games: Array<{
		id: string
		time: string
		homeTeam: NflTeamApi
		awayTeam: NflTeamApi
	}>
}

export interface NbaTeamApi {
	teamId: number
	teamName: string
	teamCity: string
	teamTricode: string
}

export interface NbaScheduleApi {
	leagueSchedule: {
		gameDates: Array<{
			games: Array<{
				gameId: string
				gameDateTimeUTC: string
				gameLabel?: string
				homeTeam: NbaTeamApi
				awayTeam: NbaTeamApi
			}>
		}>
	}
}

export interface MlbTeamApi {
	id: number
	name: string
	clubName: string
	abbreviation: string
}

export interface MlbGameApi {
	gameGuid: string
	gameDate: string
	teams: {
		home: { team: { id: number; name: string } }
		away: { team: { id: number; name: string } }
	}
	status: { startTimeTBD: boolean }
}

export interface MlbScheduleApi {
	dates: Array<{
		games: Array<MlbGameApi>
	}>
}

export interface NhlTeamApi {
	id: number
	commonName: { default: string }
	placeName: { default: string }
	abbrev: string
}

export interface NhlGameApi {
	id: number
	gameDate: string
	startTimeUTC: string
	gameType: number // 1=preseason, 2=regular, 3=playoffs
	gameState: string
	homeTeam: NhlTeamApi & { score?: number }
	awayTeam: NhlTeamApi & { score?: number }
}

export interface NhlScheduleApi {
	games: NhlGameApi[]
}
