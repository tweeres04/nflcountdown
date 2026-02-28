import { useRouteError, isRouteErrorResponse } from '@remix-run/react'

export function RouteErrorBoundary({
	notFoundTitle,
	notFoundMessage,
	genericMessage = 'We hit an unexpected error. Try refreshing the page.',
}: {
	notFoundTitle: string
	notFoundMessage: string
	genericMessage?: string
}) {
	const error = useRouteError()
	const is404 = isRouteErrorResponse(error) && error.status === 404

	return (
		<div className="font-sans text-white p-8 max-w-[500px] mx-auto text-center space-y-4 min-h-screen flex flex-col justify-center">
			<h1 className="text-2xl font-semibold">
				{is404 ? notFoundTitle : 'Something went wrong'}
			</h1>
			<p className="text-white/70">
				{is404 ? notFoundMessage : genericMessage}
			</p>
			<a href="/" className="content-link">
				Back to Team Countdown
			</a>
		</div>
	)
}
