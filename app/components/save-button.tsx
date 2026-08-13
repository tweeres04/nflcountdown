import { useFetcher, useLocation, useRouteLoaderData } from '@remix-run/react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from './ui/button'
import { analytics as mixpanel } from '~/lib/analytics'

// The root loader returns a plain Response on redirect paths, which breaks
// useRouteLoaderData<typeof loader> inference — so type just what we need
interface RootLoaderData {
	savedPaths?: string[]
}

interface SaveButtonProps {
	league: string
	teamName?: string | null
}

export default function SaveButton({ league, teamName }: SaveButtonProps) {
	const location = useLocation()
	const path = location.pathname.toLowerCase()
	const rootData = useRouteLoaderData('root') as RootLoaderData | undefined
	const fetcher = useFetcher()

	// Flip immediately on click; the root loader revalidates after the action
	const optimisticIntent = fetcher.formData?.get('intent')
	const saved = optimisticIntent
		? optimisticIntent === 'save'
		: (rootData?.savedPaths ?? []).includes(path)

	return (
		// Mirrors the Button's own w-full lg:w-auto so the button inside
		// sizes like its direct-child siblings in the actions column
		<fetcher.Form method="post" action="/api/save-page" className="w-full lg:w-auto">
			<input type="hidden" name="path" value={path} />
			<input type="hidden" name="intent" value={saved ? 'unsave' : 'save'} />
			<Button
				type="submit"
				onClick={() => {
					mixpanel.track(saved ? 'click unsave page' : 'click save page', {
						path,
						league,
						team: teamName ?? null,
					})
				}}
			>
				{saved ? (
					<>
						Saved <BookmarkCheck className="size-5" />
					</>
				) : (
					<>
						Save page <Bookmark className="size-5" />
					</>
				)}
			</Button>
		</fetcher.Form>
	)
}
