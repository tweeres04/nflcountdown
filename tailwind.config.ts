import type { Config } from 'tailwindcss'
import schedule from './nfl_schedule.json'

const teams = [...new Set(schedule.games.map((g) => g.homeTeam))]

const colors = teams.reduce(
	(result, t) => ({
		...result,
		[t.abbreviation.toLowerCase()]: {
			DEFAULT: t.primaryColor,
			secondary: t.secondaryColor,
		},
	}),
	{}
)

const safelist = teams.flatMap((t) => {
	const lowercaseAbbreviation = t.abbreviation.toLowerCase()
	return [
		`from-${lowercaseAbbreviation}`,
		`to-${lowercaseAbbreviation}-secondary`,
		`bg-${lowercaseAbbreviation}`,
		`bg-${lowercaseAbbreviation}-secondary`,
	]
})

safelist.push('bg-stone-900', 'hover:bg-stone-900')

export default {
	darkMode: ['class'],
	content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors,
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	safelist,
	plugins: [require('tailwindcss-animate')],
} satisfies Config
