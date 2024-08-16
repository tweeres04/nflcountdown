export type Team = {
	id: number
	nickName: string
	fullName: string
	abbreviation: string
	primaryColor: string
	secondaryColor: string
}

type IsoDateString = string

export type Game = {
	id: string
	time: IsoDateString
	homeTeam: Team
	awayTeam: Team
}
