// for perplexity to generate color codes
import { NbaScheduleApi } from '~/lib/types'
import { readFile } from 'node:fs/promises'

const raw = await readFile('data/nba_schedule.json', 'utf-8')
const nbaSchedule = JSON.parse(raw) as NbaScheduleApi

const nbaGames = nbaSchedule.leagueSchedule.gameDates.flatMap((gd) => gd.games)

const nbaTeams = Array.from(new Set(nbaGames.map((g) => g.homeTeam)))

console.log(JSON.stringify(nbaTeams, null, 2))
