// for perplexity to generate color codes

import nbaSchedule from 'data/nba_schedule.json'

const nbaGames = nbaSchedule.leagueSchedule.gameDates.flatMap((gd) => gd.games)

const nbaTeams = Array.from(new Set(nbaGames.map((g) => g.homeTeam)))

console.log(JSON.stringify(nbaTeams, null, 2))
