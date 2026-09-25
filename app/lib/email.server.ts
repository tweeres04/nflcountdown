import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(FormData)

if (!process.env.MAILGUN_API_KEY) {
	throw 'MAILGUN_API_KEY not found'
}

const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY,
})

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
	// Requires the mg.teamcountdown.com domain to be verified in Mailgun
	await mg.messages.create('mg.teamcountdown.com', {
		from: 'Team Countdown <noreply@teamcountdown.com>',
		to: email,
		'h:Reply-To': 'tweeres04@gmail.com',
		subject: 'Reset your Team Countdown password',
		html: `
			<p>Someone (hopefully you) asked to reset your Team Countdown password.</p>
			<p><a href="${resetUrl}">Choose a new password</a></p>
			<p>The link works for an hour. If this wasn't you, you can ignore this email and your password stays the same.</p>
		`,
		'o:tag': ['teamcountdown_password_reset'],
	})
}

// Heads-up to Tyler whenever someone signs up. Not awaited by callers so a
// Mailgun hiccup never blocks or fails a signup.
export function notifyNewAccount(email: string, method: 'email' | 'Google') {
	mg.messages
		.create('mg.teamcountdown.com', {
			from: 'Team Countdown <noreply@teamcountdown.com>',
			to: 'tweeres04@gmail.com',
			subject: `New Team Countdown account: ${email}`,
			text: `${email} just created an account with ${method}.`,
			'o:tag': ['teamcountdown_new_account'],
		})
		.catch((error) => console.error('New account email failed', error))
}
