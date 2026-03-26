import type { Game, Team } from './types'
import type { AffiliateLinks } from './cj-service'
import { getCJTicketLink } from './cj-service'
import { getTicketmasterLink } from './ticketmaster-service'

export type { AffiliateLinks }

export async function getAffiliateLinks(
	team: Team,
	league: string,
	game?: Game
): Promise<AffiliateLinks | null> {
	// Try Ticketmaster first (better coverage, exact team matching)
	const tmUrl = game
		? await getTicketmasterLink(team, league, game).catch(() => null)
		: null
	if (tmUrl) return { tickets: tmUrl }

	// Fall back to CJ/TicketNetwork
	const cjUrl = await getCJTicketLink(team, league, game).catch(() => null)
	if (cjUrl) return { tickets: cjUrl }

	return null
}
