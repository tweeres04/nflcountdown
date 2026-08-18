/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from '@remix-run/react'
import mixpanel, { Config } from 'mixpanel-browser'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

declare global {
	interface Window {
		mixpanelToken: string
		gtag: (...args: unknown[]) => void
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
const mixpanelConfig: Partial<Config> = {
	debug: process.env.NODE_ENV === 'development',
	track_pageview: true,
	persistence: 'localStorage' as const,
	autocapture: {
		pageview: 'url-with-path' as const,
		click: false,
		dead_click: true,
		input: true,
		rage_click: true,
		scroll: true,
		submit: true,
		capture_text_content: false,
	},
	record_sessions_percent: 100,
	record_mask_text_selector: '',
}

mixpanel.init(window.mixpanelToken, mixpanelConfig)

// Track whether app is opened in standalone mode (added to home screen)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches

// Register as Mixpanel super property (attached to all events)
mixpanel.register({ isStandalone })

// Add to GA as event parameter (attached to all events)
if (typeof window.gtag === 'function') {
	window.gtag('set', { is_standalone: isStandalone })
}
