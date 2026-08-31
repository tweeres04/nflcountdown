import { describe, it, expect } from 'vitest'
import { generateLeagueSportsEventSchema } from './schema-helpers'

describe('generateLeagueSportsEventSchema', () => {
	it('builds a season-level SportsEvent with the league full name and sport', () => {
		const schema = generateLeagueSportsEventSchema(
			'WORLDCUP',
			'2026',
			'2026-06-11',
			'https://teamcountdown.com/worldcup'
		)

		expect(schema).toEqual({
			'@context': 'https://schema.org',
			'@type': 'SportsEvent',
			// A tournament, so no "Season" suffix — see TOURNAMENT_LEAGUES
			name: '2026 FIFA World Cup',
			startDate: '2026-06-11',
			eventStatus: 'https://schema.org/EventScheduled',
			sport: 'Soccer',
			location: { '@type': 'Place', name: 'North America' },
			organizer: {
				'@type': 'SportsOrganization',
				name: 'FIFA World Cup',
			},
			url: 'https://teamcountdown.com/worldcup',
		})
	})

	// The tournament check has two sides, and only the World Cup side was
	// covered — which is how the assertion above stayed stale for 25 days
	// after 2ac4382 dropped the suffix.
	it('keeps the "Season" suffix for a league that has seasons', () => {
		expect(
			generateLeagueSportsEventSchema('NFL', '2026', '2026-09-04', 'x').name
		).toBe('2026 National Football League Season')
	})

	it('drops the "Season" suffix for both World Cups', () => {
		expect(
			generateLeagueSportsEventSchema('WWC', '2027', '2027-06-24', 'x').name
		).toBe("2027 FIFA Women's World Cup")
	})

	it('maps the sport per league', () => {
		expect(
			generateLeagueSportsEventSchema('NFL', '2026', '2026-09-04', 'x').sport
		).toBe('American Football')
	})
})
