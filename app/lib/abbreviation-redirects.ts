import { redirect } from '@remix-run/node'

// Renamed team abbreviations: old → new
const ABBREVIATION_REDIRECTS: Record<string, Record<string, string>> = {
	MLS: { ny: 'rbny' },
}

/**
 * Throws a 301 redirect if the team abbreviation has been renamed.
 * Call at the top of any team route loader.
 */
export function redirectIfAbbreviationRenamed(
	league: string | undefined,
	teamAbbrev: string | undefined,
	trailingPath?: string
): void {
	const leagueUpper = league?.toUpperCase() ?? ''
	const abbrevLower = teamAbbrev?.toLowerCase() ?? ''
	const redirectTo = ABBREVIATION_REDIRECTS[leagueUpper]?.[abbrevLower]
	if (redirectTo) {
		const base = `/${league?.toLowerCase()}/${redirectTo}`
		throw redirect(trailingPath ? `${base}/${trailingPath}` : base, 301)
	}
}
