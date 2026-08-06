// Leagues shown in nav and search — grouped by sport, popular sports first,
// and within a sport the bigger league leads. Matches the homepage league
// list, and search results rank by position here.
// (World Cup has no team list, so it ends up empty in team lists.)
export const LEAGUES = [
	'NFL',
	'CFB',
	'CFL',
	'NBA',
	'WNBA',
	'CEBL',
	'MLB',
	'NHL',
	'PWHL',
	'MLS',
	'NWSL',
	'CPL',
	'NSL',
	'WORLDCUP',
]

// NFL team logos live at the logos root; every other league is namespaced.
export function teamLogo(league: string, lowercaseAbbrev: string) {
	return league === 'NFL'
		? `/logos/${lowercaseAbbrev}.svg`
		: `/logos/${league.toLowerCase()}/${lowercaseAbbrev}.svg`
}
