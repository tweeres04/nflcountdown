import puppeteer from 'puppeteer'
import { writeFile } from 'node:fs/promises'

async function getNflSchedule() {
	const browser = await puppeteer.launch()
	const page = await browser.newPage()

	const accessTokenPromise = new Promise((resolve) => {
		page.on('requestfinished', async (request) => {
			if (request.url().includes('api.nfl.com')) {
				if (
					request.method() === 'POST' &&
					request.url().includes('identity/v3/token')
				) {
					const response = await request.response()?.json()

					const accessToken = response?.accessToken

					resolve(accessToken)
				}
			}
		})
	})

	await page.goto(
		`https://www.nfl.com/schedules/${new Date().getFullYear()}/REG1/`
	)

	await page.locator('.nfl-o-matchup-group')

	await browser.close()

	const accessToken = await accessTokenPromise

	const url = new URL('https://api.nfl.com/experience/v1/games')
	url.searchParams.set('season', '2025')
	url.searchParams.set('seasonType', 'REG')
	url.searchParams.set('limit', '10000')

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})

	const data = await response.json()

	const outputFile = 'data/nfl_schedule.json'
	await writeFile(outputFile, JSON.stringify(data))

	console.log(`NFL schedule saved to ${outputFile}`)
}

try {
	getNflSchedule()
} catch (error) {
	console.error('Error fetching NFL schedule:', error)
}
