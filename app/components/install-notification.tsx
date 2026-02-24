import { createContext, useContext, useEffect, useState } from 'react'
import IosShareIcon from './IosShareIcon'
import { Button } from './ui/button'
import { cn } from '~/lib/utils'
import mixpanel from 'mixpanel-browser'

interface BeforeInstallPromptEvent extends Event {
	prompt: () => void
}

export const DeferredInstallPromptContext =
	createContext<BeforeInstallPromptEvent | null>(null)

export function useDeferredInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null)

	useEffect(() => {
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
		})
	}, [])

	return { deferredPrompt }
}

export default function InstallNotification({
	countdownName,
	className,
}: {
	countdownName: string
	className: string
}) {
	const [isVisible, setIsVisible] = useState(false)
	const [isIos, setIsIos] = useState(false)
	const deferredInstallPrompt = useContext(DeferredInstallPromptContext)

	useEffect(() => {
		// 1. Check if dismissed (with 7-day expiry)
		const dismissedData = localStorage.getItem('tc_install_banner_dismissed')
		if (dismissedData) {
			try {
				const { timestamp } = JSON.parse(dismissedData)
				const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
				if (Date.now() - timestamp < sevenDaysInMs) {
					return // Still within 7-day snooze period
				}
			} catch {
				// Invalid JSON, ignore and continue
			}
		}

		// 2. Check page view count
		const pageViews = parseInt(localStorage.getItem('tc_page_view_count') || '0', 10)
		const newPageViews = pageViews + 1
		localStorage.setItem('tc_page_view_count', newPageViews.toString())

		if (newPageViews < 2) {
			return // Need at least 2 page views
		}

		// 3. Detect iOS for instructions variant
		const userAgent = window.navigator.userAgent
		const isIosDevice =
			/Mobi/.test(userAgent) &&
			/AppleWebKit/.test(userAgent) &&
			!/Chrom/.test(userAgent)
		setIsIos(isIosDevice)

		// 4. Show the banner
		mixpanel.track('install notification shown')
		setIsVisible(true)
	}, [])

	const handleDismiss = () => {
		// Set dismiss timestamp in localStorage
		localStorage.setItem(
			'tc_install_banner_dismissed',
			JSON.stringify({ timestamp: Date.now() })
		)

		setIsVisible(false)
		mixpanel.track('click close install notification')
	}

	return isVisible ? (
		<div className="fixed bottom-0 w-full lg:hidden [@media(display-mode:standalone)]:hidden">
			<div
				className={cn(
					`relative p-4 text-white max-w-[500px] lg:max-w-[750px] mx-auto`,
					className
				)}
			>
				<button
					className="absolute top-0 right-0 p-1"
					onClick={handleDismiss}
				>
					<svg // x-mark icon
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18 18 6M6 6l12 12"
						/>
					</svg>
				</button>
				<p className="text-center">
					Never miss a {countdownName} game. One tap from your home screen.
				</p>
				{deferredInstallPrompt ? (
					<Button
						onClick={() => {
							mixpanel.track('click add to home screen button')
							deferredInstallPrompt.prompt()
						}}
						className="mx-auto mt-2"
					>
						Add to home screen
					</Button>
				) : isIos ? (
					<p className="text-center mt-3">
						Tap the share button (with this icon:{' '}
						<IosShareIcon className="inline" />
						), then tap "Add to Home Screen"
					</p>
				) : null}
			</div>
		</div>
	) : null
}
