import type { Config } from 'tailwindcss'
import schedule from './nfl_schedule.json'
import mlbColors from './mlb_colors.json'
import nbaColors from './nba_colors.json'
import nhlColors from './nhl_colors.json'

const teams = [...new Set(schedule.games.map((g) => g.homeTeam))]

let colors = teams.reduce(
	(result, t) => ({
		...result,
		[t.abbreviation.toLowerCase()]: {
			DEFAULT: t.primaryColor,
			secondary: t.secondaryColor,
		},
	}),
	{}
)

const mlbColors_ = mlbColors.reduce(
	(result, c) => ({
		...result,
		['mlb-' + c.abbreviation.toLowerCase()]: {
			DEFAULT: c.color_1,
			secondary: c.color_2,
		},
	}),
	{}
)
const nbaColors_ = nbaColors.reduce(
	(result, c) => ({
		...result,
		['nba-' + c.abbreviation.toLowerCase()]: {
			DEFAULT: c.color_1,
			secondary: c.color_2,
		},
	}),
	{}
)
const nhlColors_ = nhlColors.reduce(
	(result, c) => ({
		...result,
		['nhl-' + c.abbreviation.toLowerCase()]: {
			DEFAULT: c.color_1,
			secondary: c.color_2,
		},
	}),
	{}
)

colors = {
	...colors,
	...mlbColors_,
	...nbaColors_,
	...nhlColors_,
}

const safelist = Object.keys(colors).flatMap((abbrev) => {
	return [
		`from-${abbrev}`,
		`to-${abbrev}-secondary`,
		`bg-${abbrev}`,
		`hover:bg-${abbrev}`,
		`bg-${abbrev}-secondary`,
		`hover:bg-${abbrev}-secondary`,
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
