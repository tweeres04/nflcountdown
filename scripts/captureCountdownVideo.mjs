/**
 * Records short vertical (9:16) clips of live countdown pages and stitches them
 * into one MP4 for Reels/TikTok. Run manually:
 *
 *   node scripts/captureCountdownVideo.mjs nhl/van nfl/sea mlb/sea
 *
 * Env:
 *   BASE_URL  site to record (default https://teamcountdown.com)
 *   SECONDS   seconds per clip (default 4)
 *   OUT       output directory (default captures)
 *
 * Each clip also writes a PNG so you can check framing without watching video.
 * Needs ffmpeg on PATH — puppeteer's screencast shells out to it.
 */
import { execFile } from 'node:child_process'
import { mkdir, rm, readdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import puppeteer from 'puppeteer'

const execFileAsync = promisify(execFile)

const BASE_URL = process.env.BASE_URL ?? 'https://teamcountdown.com'
const SECONDS = Number(process.env.SECONDS ?? 4)
const OUT = process.env.OUT ?? 'captures'

// These captures load the real production site, so without blocking them every
// recording would log pageviews to all four analytics tools and quietly inflate
// our own numbers. Matched as URL substrings against every outbound request, so
// add to this list if the site ever picks up another analytics vendor.
const ANALYTICS_BLOCKLIST = [
	'mixpanel',
	'mxpnl',
	'googletagmanager.com',
	'google-analytics.com',
	'analytics.google.com',
	'analytics.ahrefs.com',
	'simpleanalytics',
]

// 540x960 CSS px stays under Tailwind's md: breakpoint so we get the mobile
// layout, and deviceScaleFactor 2 renders it at exactly 1080x1920 for social.
// The generous CSS height matters: the countdown string wraps to four lines for
// long team names, and a shorter viewport clips the matchup line off the bottom.
const VIEWPORT = { width: 540, height: 960, deviceScaleFactor: 2 }

// Everything that isn't the logo, the clock, or the Share/Tickets buttons.
// Kept here as one editable block since framing is the thing we'll iterate on
// most. The breadcrumb and h1 go because the logo already says whose countdown
// this is, and dropping them pulls the clock up into frame. The install
// notification is fixed to the bottom, so it sits over the video if left in.
const HIDE_CHROME = `
	footer,
	#upcoming-games,
	h1,
	nav[aria-label="breadcrumb"],
	div.fixed.bottom-0,
	button[aria-label="Open team and league navigation"] {
		display: none !important;
	}
	html { scrollbar-width: none; }
	::-webkit-scrollbar { display: none; }
`

// Secondary actions, hidden by label because they're ghost-variant buttons with
// no stable selector. They'd otherwise land in the bottom fifth of the frame,
// which is where Instagram draws the caption and username over the video.
const HIDE_BY_LABEL = ['Quick preview', 'Show full schedule', 'Feedback']

// Size the logo to fill the frame alongside the clock. The page is top-aligned
// and taller than the viewport, so this is tuned by eye against the framing
// PNGs rather than calculated — re-check it if the countdown copy changes.
const FIT_FRAME = `
	main img { max-height: 46vh !important; height: auto !important; }
	main { padding-top: 4vh !important; }
`

const targets = process.argv.slice(2)
if (targets.length === 0) {
	console.error(
		'Usage: node scripts/captureCountdownVideo.mjs <league/team> [more...]\n' +
			'Example: node scripts/captureCountdownVideo.mjs nhl/van nfl/sea'
	)
	process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch()
const clips = []

for (const [i, target] of targets.entries()) {
	const slug = target.replace(/\//g, '-')
	const url = `${BASE_URL}/${target.replace(/^\//, '')}`
	const clipPath = path.join(OUT, `${String(i).padStart(2, '0')}-${slug}.webm`)

	const page = await browser.newPage()
	await page.setViewport(VIEWPORT)

	let blocked = 0
	await page.setRequestInterception(true)
	page.on('request', (request) => {
		if (
			ANALYTICS_BLOCKLIST.some((pattern) => request.url().includes(pattern))
		) {
			blocked += 1
			if (process.env.DEBUG_BLOCKED) {
				console.log(`  blocked: ${request.url().slice(0, 90)}`)
			}
			request.abort()
		} else {
			request.continue()
		}
	})

	// Headless Chrome has no Web Share API, so the page would render its
	// "Copy link" fallback. Stub it so the video shows the "Share" button a
	// real phone user sees.
	await page.evaluateOnNewDocument(() => {
		navigator.share = () => Promise.resolve()
	})

	await page.goto(url, { waitUntil: 'networkidle2' })
	await page.addStyleTag({ content: HIDE_CHROME + FIT_FRAME })
	await page.evaluate((labels) => {
		for (const el of document.querySelectorAll('button, a')) {
			const text = el.textContent?.trim() ?? ''
			if (labels.some((label) => text.startsWith(label))) {
				el.style.display = 'none'
			}
		}
	}, HIDE_BY_LABEL)

	// The countdown is server-rendered then hydrates before it starts ticking,
	// so settle first — otherwise the first second of video is a frozen clock.
	await new Promise((resolve) => setTimeout(resolve, 1500))

	await page.screenshot({ path: path.join(OUT, `${slug}.png`) })

	const recorder = await page.screencast({ path: clipPath })
	await new Promise((resolve) => setTimeout(resolve, SECONDS * 1000))
	await recorder.stop()
	await page.close()

	clips.push(clipPath)
	console.log(
		`Recorded ${target} -> ${clipPath} (${blocked} analytics calls blocked)`
	)
}

await browser.close()

// Normalize every clip to 1080x1920/30fps before concatenating; padding rather
// than cropping so a mis-sized capture is obvious instead of silently trimmed.
const filter =
	clips
		.map(
			(_, i) =>
				`[${i}:v]fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,` +
				`pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`
		)
		.join(';') +
	';' +
	clips.map((_, i) => `[v${i}]`).join('') +
	`concat=n=${clips.length}:v=1:a=0[out]`

const outFile = path.join(OUT, 'countdown.mp4')
await execFileAsync('ffmpeg', [
	'-y',
	...clips.flatMap((c) => ['-i', c]),
	'-filter_complex',
	filter,
	'-map',
	'[out]',
	'-c:v',
	'libx264',
	'-pix_fmt',
	'yuv420p',
	'-crf',
	'20',
	'-movflags',
	'+faststart',
	outFile,
])

const { stdout } = await execFileAsync('ffprobe', [
	'-v',
	'error',
	'-select_streams',
	'v:0',
	'-show_entries',
	'stream=width,height,duration',
	'-of',
	'csv=p=0',
	outFile,
])

console.log(`\nWrote ${outFile} (width,height,duration: ${stdout.trim()})`)
console.log(
	`Framing PNGs: ${(await readdir(OUT))
		.filter((f) => f.endsWith('.png'))
		.join(', ')}`
)
