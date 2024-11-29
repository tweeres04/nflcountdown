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
	homeTeam: Team
	awayTeam: Team
}
