import { Team } from './types'

export interface AffiliateLinks {
	tickets?: string
	betting?: string
	merch?: string
}

interface AffiliateConfig {
	stubhub: {
		affiliateId: string
		baseUrl: string
	}
	draftkings: {
		referralCode: string
		baseUrl: string
	}
	fanatics: {
		affiliateId: string
		baseUrl: string
	}
}

// Configuration with placeholder values
// TODO: Replace with real affiliate IDs from environment variables when approved
const affiliateConfig: AffiliateConfig = {
	stubhub: {
		affiliateId: process.env.STUBHUB_AFFILIATE_ID || 'PLACEHOLDER',
		baseUrl: 'https://www.stubhub.com',
	},
	draftkings: {
		referralCode: process.env.DRAFTKINGS_REFERRAL_CODE || 'PLACEHOLDER',
		baseUrl: 'https://sportsbook.draftkings.com',
	},
	fanatics: {
		affiliateId: process.env.FANATICS_AFFILIATE_ID || 'PLACEHOLDER',
		baseUrl: 'https://www.fanatics.com',
	},
}

function generateTicketLink(team: Team, config: AffiliateConfig['stubhub']): string {
	// Generate team slug from team name
	const teamSlug = team.fullName.toLowerCase().replace(/\s+/g, '-')
	
	// Build URL with affiliate tracking
	const params = new URLSearchParams()
	if (config.affiliateId !== 'PLACEHOLDER') {
		params.set('affid', config.affiliateId)
	}
	
	const queryString = params.toString()
	return `${config.baseUrl}/${teamSlug}-tickets${queryString ? `?${queryString}` : ''}`
}

function generateBettingLink(config: AffiliateConfig['draftkings']): string {
	// Build URL with referral code
	const params = new URLSearchParams()
	if (config.referralCode !== 'PLACEHOLDER') {
		params.set('referral', config.referralCode)
	}
	
	const queryString = params.toString()
	return `${config.baseUrl}${queryString ? `?${queryString}` : ''}`
}

function generateMerchLink(team: Team, league: string, config: AffiliateConfig['fanatics']): string {
	// Generate team slug from abbreviation
	const teamSlug = team.abbreviation.toLowerCase()
	const leagueSlug = league.toLowerCase()
	
	// Build URL with affiliate tracking
	const params = new URLSearchParams()
	if (config.affiliateId !== 'PLACEHOLDER') {
		params.set('_ref', config.affiliateId)
	}
	
	const queryString = params.toString()
	return `${config.baseUrl}/${leagueSlug}/${teamSlug}${queryString ? `?${queryString}` : ''}`
}

export function getAffiliateLinks(team: Team, league: string): AffiliateLinks | undefined {
	const isProduction = process.env.NODE_ENV === 'production'
	
	const links: AffiliateLinks = {}
	
	// Only add tickets link if we have the ID (or in dev)
	if (!isProduction || affiliateConfig.stubhub.affiliateId !== 'PLACEHOLDER') {
		links.tickets = generateTicketLink(team, affiliateConfig.stubhub)
	}
	
	// Only add betting link if we have the ID (or in dev)
	if (!isProduction || affiliateConfig.draftkings.referralCode !== 'PLACEHOLDER') {
		links.betting = generateBettingLink(affiliateConfig.draftkings)
	}
	
	// Only add merch link if we have the ID (or in dev)
	if (!isProduction || affiliateConfig.fanatics.affiliateId !== 'PLACEHOLDER') {
		links.merch = generateMerchLink(team, league, affiliateConfig.fanatics)
	}
	
	// Return undefined if no links at all
	if (Object.keys(links).length === 0) {
		return undefined
	}
	
	return links
}
