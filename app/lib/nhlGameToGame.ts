import nhlColors from '../../nhl_colors.json'
import { Team, Game, NhlTeamApi, NhlGameApi } from './types'

export function nhlTeamToTeam(nhlTeam: NhlTeamApi): Team {
	const color = nhlColors.find(
		(c) => c.abbreviation === nhlTeam.abbrev
	) as (typeof nhlColors)[0]

	if (!color) {
		console.error('No colors found for NHL team', nhlTeam.placeName.default, nhlTeam.commonName.default)
	}

	return {
		id: nhlTeam.id,
		nickName: nhlTeam.commonName.default,
		fullName: `${nhlTeam.placeName.default} ${nhlTeam.commonName.default}`,
		abbreviation: nhlTeam.abbrev,
		primaryColor: color?.color_1 || '#000',
		secondaryColor: color?.color_2 || '#fff',
	}
}

/**
 * Transforms an NHL API game object to the unified Game type.
 * @param nhlGame - Raw game object from NHL API
 * @param viewingTeamAbbrev - Optional team abbreviation (e.g., 'VAN') of the team page being viewed.
 *                            Used to order broadcast networks - viewing team's local networks shown before opponent's.
 *                            If not provided, defaults to home team's networks first.
 */
export function nhlGameToGame(nhlGame: any, viewingTeamAbbrev?: string): Game {
	// Determine if viewing team is home or away
	const isViewingHome = viewingTeamAbbrev === nhlGame.homeTeam.abbrev
	
	// Extract broadcast networks by market type
	const broadcasts = nhlGame.tvBroadcasts || []
	const national = broadcasts.filter((b: any) => b.market === 'N').map((b: any) => b.network)
	const home = broadcasts.filter((b: any) => b.market === 'H').map((b: any) => b.network)
	const away = broadcasts.filter((b: any) => b.market === 'A').map((b: any) => b.network)
	
	// Order: National first, then viewing team's local, then opponent's local
	// If no viewing team, default to home first
	const ordered = viewingTeamAbbrev === undefined
		? [...national, ...home, ...away]
		: isViewingHome
			? [...national, ...home, ...away]
			: [...national, ...away, ...home]
	
	// Dedupe while preserving order
	const broadcast = ordered.length > 0 ? [...new Set(ordered)].join(', ') : null
	
	return {
		id: String(nhlGame.id),
		time: nhlGame.startTimeUTC,
		homeTeam: nhlTeamToTeam(nhlGame.homeTeam),
		awayTeam: nhlTeamToTeam(nhlGame.awayTeam),
		startTimeTbd: false,
		broadcast,
	}
}
