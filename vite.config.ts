import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig, configDefaults } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		remix({
			future: {
				v3_fetcherPersist: true,
				v3_relativeSplatPath: true,
				v3_throwAbortReason: true,
			},
		}),
		tsconfigPaths(),
	],
	test: {
		// The live schedule-getter smoke test is opt-in via `npm run
		// verify-schedules`, so keep it out of the default vitest run.
		exclude: [...configDefaults.exclude, 'cron/**'],
	},
})
