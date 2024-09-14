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
	const LEAGUE = process.env.LEAGUE ?? 'NFL'
	const formData = await request.formData()
	const entries = [...formData.entries()]
	entries.push(['referer', request.headers.get('referer') ?? 'Not found'])
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

	const referer = request.headers.get('referer')
	const newUrl = new URL(referer ?? '/')
	newUrl.searchParams.set('feedback_sent', 'true')

	return redirect(newUrl.toString())
}
