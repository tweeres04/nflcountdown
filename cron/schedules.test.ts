import { it, expect } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, stat, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Smoke test that every schedule getter can still fetch from its upstream and
// produce valid output. This makes live network calls, so it's deliberately
// kept out of the default `vitest` run (see vite.config.ts) and is invoked on
// demand with `npm run verify-schedules`. It's the tripwire for upstream breakage
// like a CDN starting to 403 or an API rotating credentials.

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const tsx = path.join(repoRoot, 'cron', 'node_modules', '.bin', 'tsx')

const TIMEOUT = 120_000

// Each getter writes data/<league>_schedule.json. Listed explicitly so adding a
// new getter is a conscious step that also adds test coverage.
const getters = [
	{ league: 'nba', script: 'getNbaSchedule.ts' },
	{ league: 'wnba', script: 'getWnbaSchedule.ts' },
	{ league: 'nfl', script: 'getNflSchedule.ts' },
	{ league: 'mlb', script: 'getMlbSchedule.ts' },
	{ league: 'nhl', script: 'getNhlSchedule.ts' },
	{ league: 'cpl', script: 'getCplSchedule.ts' },
	{ league: 'mls', script: 'getMlsSchedule.ts' },
	{ league: 'nwsl', script: 'getNwslSchedule.ts' },
	{ league: 'pwhl', script: 'getPwhlSchedule.ts' },
	{ league: 'cfb', script: 'getCfbSchedule.ts' },
	{ league: 'worldcup', script: 'getWorldCupSchedule.ts' },
]

it.concurrent.each(getters)(
	'fetches the $league schedule',
	async ({ league, script }) => {
		const outputFile = path.join(repoRoot, 'data', `${league}_schedule.json`)

		// Remove any existing output so we're asserting on this run's fetch.
		await rm(outputFile, { force: true })

		// Getters exit non-zero on failure, so a clean run means the fetch worked.
		await execFileAsync(tsx, [path.join('cron', script)], {
			cwd: repoRoot,
			timeout: TIMEOUT - 10_000,
		})

		// The run should have produced a non-trivial, parseable schedule file.
		const { size } = await stat(outputFile)
		expect(size).toBeGreaterThan(500)
		expect(JSON.parse(await readFile(outputFile, 'utf8'))).toBeTruthy()
	},
	TIMEOUT
)
