import { ActionFunctionArgs, redirect } from '@remix-run/node'

import Mailgun from 'mailgun.js'
const mailgun = new Mailgun(FormData)

if (!process.env.MAILGUN_API_KEY) {
	throw 'MAILGUN_API_KEY not found'
}

const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY,
})

export async function action({ request }: ActionFunctionArgs) {
	const referer = request.headers.get('referer')
	// Extract league from referer URL (e.g., /nfl/kc or /nba/bos)
	let LEAGUE = 'NFL' // default
	if (referer) {
		const refererUrl = new URL(referer)
		const pathParts = refererUrl.pathname.split('/').filter(Boolean)
		if (pathParts.length > 0) {
			const possibleLeague = pathParts[0].toUpperCase()
			// Only recognize supported leagues
			if (['NFL', 'NBA', 'MLB'].includes(possibleLeague)) {
				LEAGUE = possibleLeague
			}
		}
	}

	const formData = await request.formData()
	const entries = [...formData.entries()]
	entries.push(['referer', referer ?? 'Not found'])
	const userEmail = formData.get('email') ?? undefined
	const emailBody = `
		<ul style="list-style: none; padding-left: 0;">
			${entries
				.map(
					([k, v]) =>
						`<li><strong>${k}</strong>: <pre style="font-family: sans-serif;">${v}</pre></li>`
				)
				.join('')}
		</ul>
	`

	mg.messages.create('tweeres.ca', {
		from: `${LEAGUE} Countdown feedback <feedback@${LEAGUE.toLowerCase()}countdown.tweeres.ca>`,
		to: 'tweeres04@gmail.com',
		subject: `${LEAGUE} Countdown feedback`,
		html: emailBody,
		'o:tag': [`${LEAGUE.toLowerCase()}countdown_feedback`],
		'h:Reply-To': userEmail,
	})

	const newUrl = new URL(referer ?? '/')
	newUrl.searchParams.set('feedback_sent', 'true')

	return redirect(newUrl.toString())
}
