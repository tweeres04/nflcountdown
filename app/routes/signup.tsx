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
import {
	createUser,
	isEmailTakenError,
	normalizeEmail,
	validateCredentials,
} from '~/lib/auth.server'
import { clientIp, rateLimit } from '~/lib/rateLimit.server'
import { applyPendingSave } from '~/lib/savedPages.server'
import { createUserSession, getUser } from '~/lib/session.server'

export const meta: MetaFunction = () => [
	{ title: 'Create your account - Team Countdown' },
	{ name: 'robots', content: 'noindex' },
]

export async function loader({ request }: LoaderFunctionArgs) {
	// Db-verified so a stale cookie doesn't bounce you away from signup
	if (await getUser(request)) {
		throw redirect('/')
	}
	return null
}

export async function action({ request }: ActionFunctionArgs) {
	if (!rateLimit(`signup:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
		return json(
			{ error: 'Too many signups from here. Try again in a bit.' },
			{ status: 429 }
		)
	}

	const formData = await request.formData()
	const email = normalizeEmail(String(formData.get('email') ?? ''))
	const password = String(formData.get('password') ?? '')

	const error = validateCredentials(email, password)
	if (error) {
		return json({ error }, { status: 400 })
	}

	let user: { id: number }
	try {
		user = await createUser(email, password)
	} catch (error) {
		if (isEmailTakenError(error)) {
			return json(
				{ error: 'That email already has an account. Log in instead?' },
				{ status: 400 }
			)
		}
		throw error
	}

	await applyPendingSave(user.id, formData)

	trackFromServer(request, user.id, 'sign up', { method: 'password' })
	setProfileEmail(request, user.id, email)

	return createUserSession(user.id, '/')
}

export default function Signup() {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const [searchParams] = useSearchParams()
	const pendingSave = searchParams.get('save')
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
						<h1 className="text-2xl">Create your account</h1>
						<p className="text-white/80">
							{pendingSave
								? "You need an account to save pages. Create one and we'll save that page for you."
								: 'Save your teams and see every countdown the moment you land on the home screen.'}
						</p>
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
								autoComplete="new-password"
								minLength={8}
								required
							/>
							<p className="text-sm text-white/60">At least 8 characters</p>
						</div>
						{actionData?.error ? (
							<p className="text-sm text-red-300">{actionData.error}</p>
						) : null}
						<Button type="submit" fullWidth disabled={submitting}>
							{submitting ? 'Creating account...' : 'Create account'}
						</Button>
					</Form>
					<Button asChild>
						<a
							href={googleHref}
							onClick={() =>
								mixpanel.track('click continue with google', { page: 'signup' })
							}
						>
							Continue with Google <GoogleIcon className="size-5" />
						</a>
					</Button>
					<p className="text-white/80">
						Already have an account?{' '}
						<Link
							to={`/login?${searchParams.toString()}`}
							className="content-link"
						>
							Log in
						</Link>
					</p>
				</div>
			</div>
			<Footer dark />
		</div>
	)
}
