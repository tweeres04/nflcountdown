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
			name: '2026 FIFA World Cup Season',
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

	it('maps the sport per league', () => {
		expect(
			generateLeagueSportsEventSchema('NFL', '2026', '2026-09-04', 'x').sport
		).toBe('American Football')
	})
})
