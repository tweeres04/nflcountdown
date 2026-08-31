import cfbColors from '../../cfb_colors.json'
import { Team, Game, CfbTeamApi, CfbEventApi } from './types'

export function cfbTeamToTeam({
	id,
	abbreviation,
	displayName,
	name,
	color,
	alternateColor,
}: CfbTeamApi): Team {
	// Keyed by ESPN's abbreviation, like every other colors file — so Texas A&M
	// is "TA&M" here, not "TAM". getCfbSchedule.ts filters on this same key, so
	// a mismatch silently drops every one of that team's games from the feed.
	const colorData = cfbColors.find((c) => c.abbreviation === abbreviation)

	if (!colorData) {
		console.error('No colors found for CFB team', displayName, abbreviation)
	}

	return {
		id: id,
		nickName: name, // e.g. "Wolverines", "Crimson Tide", "Buckeyes"
		fullName: displayName,
		// Drop the "&" for the outward-facing slug: this becomes the URL
		// (/cfb/tam) and the logo filename (tam.svg). CFB is the only league
		// with an "&" in an abbreviation.
		abbreviation: abbreviation.replace('&', ''),
		primaryColor: colorData?.color_1 || `#${color}` || '#000000',
		secondaryColor: colorData?.color_2 || `#${alternateColor}` || '#333333',
	}
}

/**
 * Transforms an ESPN CFB API event object to the unified Game type.
 * @param event - Raw event object from ESPN API
 */
export function cfbGameToGame(event: CfbEventApi): Game {
	const competition = event.competitions[0]
	if (!competition) {
		throw new Error(`No competition found for event ${event.id}`)
	}

	const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home')
	const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away')

	if (!homeCompetitor || !awayCompetitor) {
		throw new Error(`Missing home or away competitor for event ${event.id}`)
	}

	const broadcasts = competition.broadcasts || []
	const broadcastNames = broadcasts.flatMap((b) => b.names).join(', ')

	const startTimeTbd = !competition.timeValid
	// Shift TBD dates to noon UTC so the calendar date stays correct in all US timezones
	// ESPN returns T04:00Z (midnight Eastern) for placeholder times, which renders as
	// the previous day for anyone west of Eastern time
	const time = startTimeTbd
		? event.date.replace(/T\d{2}:\d{2}Z$/, 'T12:00Z')
		: event.date

	return {
		id: event.id,
		time,
		homeTeam: cfbTeamToTeam(homeCompetitor.team),
		awayTeam: cfbTeamToTeam(awayCompetitor.team),
		startTimeTbd,
		broadcast: broadcastNames || null,
		neutralSite: competition.neutralSite ?? null,
	}
}
