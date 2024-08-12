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
	const formData = await request.formData()
	const entries = [...formData.entries()]
	entries.push(['referer', request.headers.get('referer') ?? 'Not found'])
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
		from: 'NFL Countdown feedback <feedback@nflcountdown.tweeres.ca>',
		to: 'tweeres04@gmail.com',
		subject: 'NFL Countdown feedback',
		html: emailBody,
		'o:tag': ['nflcountdown_feedback'],
	})

	const referer = request.headers.get('referer')
	const newUrl = new URL(referer ?? '/')
	newUrl.searchParams.set('feedback_sent', 'true')

	return redirect(newUrl.toString())
}