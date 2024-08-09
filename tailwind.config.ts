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

const safelist = teams.flatMap((t) => [
	`from-${t.abbreviation.toLowerCase()}`,
	`to-${t.abbreviation.toLowerCase()}-secondary`,
])

console.log({ safelist })

export default {
	content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors,
		},
	},
	safelist,
	plugins: [],
} satisfies Config
