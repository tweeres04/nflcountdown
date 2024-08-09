import type { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => {
	return [
		{ title: 'When is the next NFL game? - NFL Countdown' },
		{
			name: 'description',
			content:
				'The fastest and prettiest way to check the next NFL game. Launches instantly from your home screen.',
		},
	]
}

export default function Index() {
	return (
		<div className="font-sans p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-12">
			<h1 className="text-3xl">NFL Countdown</h1>
		</div>
	)
}
