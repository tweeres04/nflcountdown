import { useEffect } from 'react'
import { useRevalidator } from '@remix-run/react'

// A page reopened from the home screen (or a background tab) past the end of
// a game would show that game as completed until a refresh, so reload the
// loader data when someone comes back after it has ended.
//
// We check the clock when the page becomes visible rather than on a timer, so
// nothing is fetched for a page nobody is looking at.
export function useReloadOnReturnAfterGameEnds(gameEnd: number | null) {
	const { revalidate } = useRevalidator()

	useEffect(() => {
		if (gameEnd === null) return

		const reloadIfGameEnded = () => {
			if (document.visibilityState === 'visible' && Date.now() >= gameEnd) {
				revalidate()
			}
		}
		document.addEventListener('visibilitychange', reloadIfGameEnded)

		return () =>
			document.removeEventListener('visibilitychange', reloadIfGameEnded)
	}, [gameEnd, revalidate])
}
