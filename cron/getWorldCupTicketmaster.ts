import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// FIFA World Cup 2026 runs June 11 – July 19 across USA / Canada / Mexico.
// The Ticketmaster Discovery API returns matches across all three host countries
// when we search by keyword + classification (NOT countryCode — that filter
// excludes international listings).
const WC_START = '2026-06-11T00:00:00Z'
const WC_END = '2026-07-20T00:00:00Z'
const API_BASE = 'https://app.ticketmaster.com/discovery/v2'

const SCHEDULE_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'worldcup_schedule.json')
		: path.join(__dirname, '..', 'data', 'worldcup_schedule.json')

const OUTPUT_FILE =
	process.env.NODE_ENV === 'production'
		? path.join(__dirname, 'data', 'worldcup-ticketmaster.json')
		: path.join(__dirname, '..', 'data', 'worldcup-ticketmaster.json')

interface TmEvent {
	id: string
	name: string
	url: string
	dates: { start: { localDate: string; dateTime?: string } }
}

async function fetchAllTmEvents(apiKey: string): Promise<TmEvent[]> {
	const all: TmEvent[] = []
	let page = 0
	while (true) {
		const params = new URLSearchParams({
			apikey: apiKey,
			keyword: 'World Cup',
			startDateTime: WC_START,
			endDateTime: WC_END,
			classificationName: 'Soccer',
			size: '200',
			page: String(page),
		})
		const res = await fetch(`${API_BASE}/events.json?${params}`)
		if (!res.ok) {
			throw new Error(
				`Ticketmaster API ${res.status}: ${await res.text()}`
			)
		}
		const json = await res.json()
		const events: TmEvent[] = json?._embedded?.events ?? []
		all.push(...events)
		const totalPages = json?.page?.totalPages ?? 1
		page++
		if (page >= totalPages) break
	}
	return all
}

// Event names that include a FIFA match number — covers all of:
//   "World Cup: Match 8 Group B- Qatar vs Switzerland"
//   "World Cup Final: Match 104"
//   "World Cup Third Place: Match 103"
//   "World Cup Quarterfinals: W89 vs. W90 (Match 97)"
//   "World Cup Semifinals: W97 vs. W98 (Match 101)"
const NAME_PREFIX_REGEX = /^World Cup\b/i
const MATCH_NUMBER_REGEX = /\bMatch\s+(\d+)\b/i

async function main() {
	const apiKey = process.env.TICKET_MASTER_API_KEY
	if (!apiKey) {
		console.error('Missing TICKET_MASTER_API_KEY')
		process.exit(1)
	}

	console.log('Loading FIFA schedule…')
	const scheduleRaw = await fs.readFile(SCHEDULE_FILE, 'utf-8')
	const schedule = JSON.parse(scheduleRaw) as {
		Results: Array<{ IdMatch: string; MatchNumber: number }>
	}
	const matchNumberToIdMatch = new Map<number, string>()
	for (const m of schedule.Results) {
		matchNumberToIdMatch.set(m.MatchNumber, m.IdMatch)
	}
	console.log(`  ${matchNumberToIdMatch.size} matches in FIFA schedule`)

	console.log('Fetching Ticketmaster World Cup events…')
	const events = await fetchAllTmEvents(apiKey)
	console.log(`  ${events.length} events returned by API`)

	const matchNumberToUrl = new Map<number, string>()
	let parsed = 0
	let skipped = 0
	for (const e of events) {
		if (!NAME_PREFIX_REGEX.test(e.name)) {
			skipped++
			continue
		}
		const m = MATCH_NUMBER_REGEX.exec(e.name)
		if (!m) {
			skipped++
			continue
		}
		const matchNumber = parseInt(m[1], 10)
		// Prefer the first match seen — TM occasionally has duplicate listings
		if (!matchNumberToUrl.has(matchNumber)) {
			matchNumberToUrl.set(matchNumber, e.url)
			parsed++
		}
	}
	console.log(
		`  parsed ${parsed} match events (skipped ${skipped} non-match events)`
	)

	const map: Record<string, string> = {}
	let mapped = 0
	for (const [matchNumber, idMatch] of matchNumberToIdMatch) {
		const url = matchNumberToUrl.get(matchNumber)
		if (url) {
			map[idMatch] = url
			mapped++
		}
	}

	const missing: number[] = []
	for (let i = 1; i <= matchNumberToIdMatch.size; i++) {
		if (!matchNumberToUrl.has(i)) missing.push(i)
	}

	console.log(
		`Mapped ${mapped}/${matchNumberToIdMatch.size} FIFA matches to Ticketmaster URLs`
	)
	if (missing.length > 0) {
		console.log(`  missing match numbers: ${missing.join(', ')}`)
	}

	await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
	await fs.writeFile(OUTPUT_FILE, JSON.stringify(map, null, 2))
	console.log(`Saved ${OUTPUT_FILE}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
