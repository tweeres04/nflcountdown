import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
	json,
	redirect,
} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useNavigation,
	useSearchParams,
} from '@remix-run/react'
import GoogleIcon from '~/components/GoogleIcon'
import { Button } from '~/components/ui/button'
import { setProfileEmail, trackFromServer } from '~/lib/analytics.server'
import { analytics as mixpanel } from '~/lib/analytics'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import Footer from '~/components/footer'
import { normalizeEmail, verifyLogin } from '~/lib/auth.server'
import { clientIp, rateLimit } from '~/lib/rateLimit.server'
import { applyPendingSave } from '~/lib/savedPages.server'
import { createUserSession, getUser } from '~/lib/session.server'

export const meta: MetaFunction = () => [
	{ title: 'Log in - Team Countdown' },
	{ name: 'robots', content: 'noindex' },
]

export async function loader({ request }: LoaderFunctionArgs) {
	// Db-verified so a stale cookie doesn't bounce you away from login
	if (await getUser(request)) {
		throw redirect('/')
	}
	return null
}

export async function action({ request }: ActionFunctionArgs) {
	if (!rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000)) {
		return json(
			{ error: 'Too many tries. Wait a few minutes and try again.' },
			{ status: 429 }
		)
	}

	const formData = await request.formData()
	const email = normalizeEmail(String(formData.get('email') ?? ''))
	const password = String(formData.get('password') ?? '')

	const user = await verifyLogin(email, password)
	if (!user) {
		return json(
			{ error: "That email and password don't match. Try again?" },
			{ status: 400 }
		)
	}

	await applyPendingSave(user.id, formData)

	trackFromServer(request, user.id, 'log in', { method: 'password' })
	setProfileEmail(request, user.id, user.email)

	return createUserSession(user.id, '/')
}

export default function Login() {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const [searchParams] = useSearchParams()
	const pendingSave = searchParams.get('save')
	const googleFailed = searchParams.get('error') === 'google'
	const submitting = navigation.state === 'submitting'
	const googleHref = pendingSave
		? `/auth/google?save=${encodeURIComponent(pendingSave)}`
		: '/auth/google'

	return (
		<div className="flex flex-col min-h-screen">
			<div className="font-sans text-white p-4 w-full max-w-[500px] mx-auto space-y-10 grow pb-20">
				<Link to="/" className="block text-3xl">
					Team Countdown
				</Link>
				<div className="space-y-5">
					<div className="space-y-3">
						<h1 className="text-2xl">Log in</h1>
						{pendingSave ? (
							<p className="text-white/80">
								Log in and we&apos;ll save that page for you.
							</p>
						) : null}
					</div>
					<Form method="post" className="space-y-4">
						{pendingSave ? (
							<input type="hidden" name="save" value={pendingSave} />
						) : null}
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
						<div className="space-y-1">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
							/>
						</div>
						{actionData?.error ? (
							<p className="text-sm text-red-300">{actionData.error}</p>
						) : null}
						<Button type="submit" fullWidth disabled={submitting}>
							{submitting ? 'Logging in...' : 'Log in'}
						</Button>
					</Form>
					{googleFailed ? (
						<p className="text-sm text-red-300">
							Google sign-in didn&apos;t work. Try again?
						</p>
					) : null}
					<Button asChild>
						<a
							href={googleHref}
							onClick={() =>
								mixpanel.track('click continue with google', { page: 'login' })
							}
						>
							Continue with Google <GoogleIcon className="size-5" />
						</a>
					</Button>
					<p className="text-white/80">
						<Link to="/forgot-password" className="content-link">
							Forgot your password?
						</Link>
					</p>
					<p className="text-white/80">
						New here?{' '}
						<Link
							to={`/signup?${searchParams.toString()}`}
							className="content-link"
						>
							Create an account
						</Link>
					</p>
				</div>
			</div>
			<Footer dark />
		</div>
	)
}
