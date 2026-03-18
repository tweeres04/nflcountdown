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

// WNBA uses the same API format as NBA
export type WnbaTeamApi = NbaTeamApi
export type WnbaScheduleApi = NbaScheduleApi

export interface CplTeamApi {
	teamId: string
	officialName: string
	acronymName: string
}

export interface CplMatchApi {
	matchId: string
	matchDateUtc: string
	home: CplTeamApi
	away: CplTeamApi
	stadiumName: string
	status: string
}

export interface CplScheduleApi {
	matches: CplMatchApi[]
}

export interface MlsTeamApi {
	id: string
	abbreviation: string
	displayName: string
	shortDisplayName: string
	name: string
	color: string
	alternateColor: string
	logo: string
}

export interface MlsCompetitorApi {
	id: string
	type: string
	homeAway: 'home' | 'away'
	team: MlsTeamApi
}

export interface MlsCompetitionApi {
	id: string
	date: string
	timeValid?: boolean
	broadcasts?: Array<{
		market: string
		names: string[]
	}>
	competitors: MlsCompetitorApi[]
}

export interface MlsEventApi {
	id: string
	date: string
	name: string
	competitions: MlsCompetitionApi[]
}

export interface MlsScheduleApi {
	events: MlsEventApi[]
}

// NWSL uses the same ESPN API format as MLS
export type NwslTeamApi = MlsTeamApi
export type NwslCompetitorApi = MlsCompetitorApi
export type NwslCompetitionApi = MlsCompetitionApi
export type NwslEventApi = MlsEventApi
export type NwslScheduleApi = MlsScheduleApi

// CFB uses the same ESPN API format as MLS
export type CfbTeamApi = MlsTeamApi
export type CfbCompetitorApi = MlsCompetitorApi
export type CfbCompetitionApi = MlsCompetitionApi
export type CfbEventApi = MlsEventApi
export type CfbScheduleApi = MlsScheduleApi

// PWHL uses the HockeyTech API (lscluster.hockeytech.com)
export interface PwhlGameApi {
	ID: string
	Date: string
	GameDateISO8601: string
	SeasonID: string
	HomeID: string
	HomeCode: string
	HomeCity: string
	HomeNickname: string
	HomeLongName: string
	VisitorID: string
	VisitorCode: string
	VisitorCity: string
	VisitorNickname: string
	VisitorLongName: string
	GameStatusString: string
}

export interface PwhlScheduleApi {
	SiteKit: {
		Scorebar: PwhlGameApi[]
	}
}
