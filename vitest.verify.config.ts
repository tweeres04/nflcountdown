import { defineConfig } from 'vitest/config'

// Config for `npm run verify-schedules` — runs only the live schedule-getter
// smoke test. Separate from the default vitest run so the network-dependent
// test is opt-in.
export default defineConfig({
	test: {
		include: ['cron/schedules.test.ts'],
		testTimeout: 120_000,
	},
})
