import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
	json,
} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useLoaderData,
	useNavigation,
	useSearchParams,
} from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import Footer from '~/components/footer'
import { updatePassword, validatePassword } from '~/lib/auth.server'
import {
	consumeResetToken,
	findResetToken,
} from '~/lib/passwordReset.server'
import { createUserSession } from '~/lib/session.server'

export const meta: MetaFunction = () => [
	{ title: 'Choose a new password - Team Countdown' },
	{ name: 'robots', content: 'noindex' },
]

export async function loader({ request }: LoaderFunctionArgs) {
	const token = new URL(request.url).searchParams.get('token') ?? ''
	const validToken = token ? Boolean(await findResetToken(token)) : false
	return json({ validToken })
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const token = String(formData.get('token') ?? '')
	const password = String(formData.get('password') ?? '')

	const error = validatePassword(password)
	if (error) {
		return json({ error }, { status: 400 })
	}

	const resetToken = await consumeResetToken(token)
	if (!resetToken) {
		return json(
			{
				error:
					'That reset link has expired or was already used. Request a new one and try again.',
			},
			{ status: 400 }
		)
	}

	await updatePassword(resetToken.userId, password)

	return createUserSession(resetToken.userId, '/')
}

export default function ResetPassword() {
	const { validToken } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token') ?? ''
	const submitting = navigation.state === 'submitting'

	return (
		<div className="flex flex-col min-h-screen">
			<div className="font-sans text-white p-4 w-full max-w-[500px] mx-auto space-y-10 grow pb-20">
				<Link to="/" className="block text-3xl">
					Team Countdown
				</Link>
				<div className="space-y-5">
					<h1 className="text-2xl">Choose a new password</h1>
					{validToken ? (
						<Form method="post" className="space-y-4">
							<input type="hidden" name="token" value={token} />
							<div className="space-y-1">
								<Label htmlFor="password">New password</Label>
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
							<Button type="submit" disabled={submitting}>
								{submitting ? 'Saving...' : 'Save new password'}
							</Button>
						</Form>
					) : (
						<p className="text-white/80">
							That reset link has expired or was already used.{' '}
							<Link to="/forgot-password" className="content-link">
								Request a new one
							</Link>
						</p>
					)}
				</div>
			</div>
			<Footer dark />
		</div>
	)
}
