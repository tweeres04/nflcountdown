import {
	ActionFunctionArgs,
	MetaFunction,
	json,
} from '@remix-run/node'
import { Form, Link, useActionData, useNavigation } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import Footer from '~/components/footer'
import { trackFromServer } from '~/lib/analytics.server'
import { normalizeEmail, validateEmail } from '~/lib/auth.server'
import { sendPasswordResetEmail } from '~/lib/email.server'
import { createResetToken } from '~/lib/passwordReset.server'
import { clientIp, rateLimit } from '~/lib/rateLimit.server'

export const meta: MetaFunction = () => [
	{ title: 'Reset your password - Team Countdown' },
	{ name: 'robots', content: 'noindex' },
]

export async function action({ request }: ActionFunctionArgs) {
	if (!rateLimit(`forgot:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
		return json(
			{ error: 'Too many tries. Wait a bit and try again.', sent: false },
			{ status: 429 }
		)
	}

	const formData = await request.formData()
	const email = normalizeEmail(String(formData.get('email') ?? ''))

	const error = validateEmail(email)
	if (error) {
		return json({ error, sent: false }, { status: 400 })
	}

	// Same response whether or not the account exists, so the form can't be
	// used to probe which emails are signed up
	const reset = await createResetToken(email)
	if (reset) {
		trackFromServer(request, reset.userId, 'request password reset')
		const origin =
			process.env.NODE_ENV === 'production'
				? 'https://teamcountdown.com'
				: new URL(request.url).origin
		const resetUrl = `${origin}/reset-password?token=${reset.token}`
		if (process.env.NODE_ENV !== 'production') {
			console.log(`Password reset link: ${resetUrl}`)
		}
		try {
			await sendPasswordResetEmail(email, resetUrl)
		} catch (error) {
			console.error('Password reset email failed to send', error)
		}
	}

	return json({ error: null, sent: true })
}

export default function ForgotPassword() {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'

	return (
		<div className="flex flex-col min-h-screen">
			<div className="font-sans text-white p-4 w-full max-w-[500px] mx-auto space-y-10 grow pb-20">
				<Link to="/" className="block text-3xl">
					Team Countdown
				</Link>
				<div className="space-y-5">
					<div className="space-y-3">
						<h1 className="text-2xl">Reset your password</h1>
						<p className="text-white/80">
							Enter your email and we&apos;ll send you a link to choose a new
							one.
						</p>
					</div>
					{actionData?.sent ? (
						<p>
							If that email has an account, a reset link is on its way. Check
							your inbox.
						</p>
					) : (
						<Form method="post" className="space-y-4">
							<div className="space-y-1">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
								/>
							</div>
							{actionData?.error ? (
								<p className="text-sm text-red-300">{actionData.error}</p>
							) : null}
							<Button type="submit" disabled={submitting}>
								{submitting ? 'Sending...' : 'Send reset link'}
							</Button>
						</Form>
					)}
					<p className="text-white/80">
						Remembered it?{' '}
						<Link to="/login" className="content-link">
							Log in
						</Link>
					</p>
				</div>
			</div>
			<Footer dark />
		</div>
	)
}
