// Leagues shown in nav and search, in popularity order — matches the
// homepage league list, and search results rank by position here.
// (World Cup has no team list, so it ends up empty in team lists.)
export const LEAGUES = [
	'NFL',
	'CFB',
	'NBA',
	'WNBA',
	'MLB',
	'NHL',
	'PWHL',
	'MLS',
	'NWSL',
	'WORLDCUP',
]

// NFL team logos live at the logos root; every other league is namespaced.
export function teamLogo(league: string, lowercaseAbbrev: string) {
	return league === 'NFL'
		? `/logos/${lowercaseAbbrev}.svg`
		: `/logos/${league.toLowerCase()}/${lowercaseAbbrev}.svg`
}
