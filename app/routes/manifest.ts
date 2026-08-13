import { json } from '@remix-run/node'

// The homepage app: saved pages + search, installable with the brand icon.
// Team/league pages keep their own manifests.
export function loader() {
	return json({
		name: 'Team Countdown',
		short_name: 'Team Countdown',
		icons: [
			{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
			{
				src: '/icon-maskable-192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/icon-maskable-512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
		id: '/',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		theme_color: '#111111',
		background_color: '#111111',
	})
}
