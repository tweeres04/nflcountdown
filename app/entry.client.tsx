/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from '@remix-run/react'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import mixpanel from 'mixpanel-browser'

declare global {
	interface Window {
		mixpanelToken: string
	}
}

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<RemixBrowser />
		</StrictMode>
	)
})

if (!window.mixpanelToken) {
	throw 'No mixpanel token'
}

// Initialize Mixpanel
mixpanel.init(window.mixpanelToken, {
	debug: process.env.NODE_ENV === 'development',
	track_pageview: true,
	persistence: 'localStorage',
	autocapture: {
		pageview: 'full-url',
		click: false,
		dead_click: true,
		input: true,
		rage_click: true,
		scroll: true,
		submit: true,
		capture_text_content: false,
	},
	record_sessions_percent: 100,
})
