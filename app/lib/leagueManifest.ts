const LEAGUE_MANIFEST: Record<
	string,
	{ fullName: string; shortName: string; brandColor: string }
> = {
	NFL: { fullName: 'NFL Countdown', shortName: 'NFL', brandColor: '#013369' },
	NBA: { fullName: 'NBA Countdown', shortName: 'NBA', brandColor: '#1D428A' },
	MLB: { fullName: 'MLB Countdown', shortName: 'MLB', brandColor: '#002D72' },
	NHL: { fullName: 'NHL Countdown', shortName: 'NHL', brandColor: '#000000' },
	WNBA: { fullName: 'WNBA Countdown', shortName: 'WNBA', brandColor: '#FF6A00' },
	CPL: { fullName: 'CPL Countdown', shortName: 'CPL', brandColor: '#6D2077' },
	MLS: { fullName: 'MLS Countdown', shortName: 'MLS', brandColor: '#292929' },
	NWSL: { fullName: 'NWSL Countdown', shortName: 'NWSL', brandColor: '#003087' },
	PWHL: { fullName: 'PWHL Countdown', shortName: 'PWHL', brandColor: '#350282' },
	CFB: { fullName: 'College Football Countdown', shortName: 'CFB', brandColor: '#1a1a1a' },
	WORLDCUP: { fullName: 'FIFA World Cup Countdown', shortName: 'World Cup', brandColor: '#326295' },
}

export function buildLeagueManifest(league: string | undefined, path: string) {
	const LEAGUE = league?.toUpperCase() ?? ''
	const meta = LEAGUE_MANIFEST[LEAGUE]

	if (!meta) {
		throw new Response(null, { status: 404 })
	}

	const lowercaseLeague = LEAGUE.toLowerCase()

	return {
		name: meta.fullName,
		short_name: meta.shortName,
		icons: [
			{
				src: `/logos/${lowercaseLeague}.png`,
				sizes: 'any',
				type: 'image/png',
			},
		],
		id: path,
		start_url: path,
		scope: `/${lowercaseLeague}`,
		display: 'standalone',
		theme_color: meta.brandColor,
		background_color: meta.brandColor,
	}
}
