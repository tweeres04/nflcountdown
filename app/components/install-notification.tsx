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

const ONE_DAY_MS = 24 * 60 * 60 * 1000

type InAppBrowserApp =
	| 'Facebook'
	| 'Instagram'
	| 'LinkedIn'
	| 'Google'
	| 'TikTok'
	| 'unknown'

function detectInAppBrowser(): InAppBrowserApp | null {
	const ua = navigator.userAgent || ''

	if (/FBAN|FBAV/i.test(ua)) return 'Facebook'
	if (/Instagram/i.test(ua)) return 'Instagram'
	if (/LinkedInApp/i.test(ua)) return 'LinkedIn'
	if (/GSA\//i.test(ua)) return 'Google'
	if (/BytedanceWebview|musical_ly/i.test(ua)) return 'TikTok'

	// Generic iOS WebView: has AppleWebKit but not Safari/ or CriOS
	const isIos = /iPhone|iPad|iPod/.test(ua)
	const hasWebKit = /AppleWebKit/.test(ua)
	const hasSafari = /Safari\//.test(ua)
	const hasChrome = /CriOS/.test(ua)
	if (isIos && hasWebKit && !hasSafari && !hasChrome) return 'unknown'

	return null
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
	const [inAppBrowser, setInAppBrowser] = useState<InAppBrowserApp | null>(null)
	const [copied, setCopied] = useState(false)
	const deferredInstallPrompt = useContext(DeferredInstallPromptContext)

	useEffect(() => {
		// Clean up legacy page-view counter (no longer used)
		localStorage.removeItem('tc_page_view_count')

		const ua = window.navigator.userAgent

		// Detect in-app browser first — has its own sessionStorage dismissal
		const inAppApp = detectInAppBrowser()
		if (inAppApp) {
			if (sessionStorage.getItem('tc_inapp_banner_dismissed')) return
			setInAppBrowser(inAppApp)
			mixpanel.track('install notification shown', {
				context: 'in_app_browser',
				app: inAppApp,
			})
			setIsVisible(true)
			return
		}

		// Check if dismissed within the last day
		const dismissedData = localStorage.getItem('tc_install_banner_dismissed')
		if (dismissedData) {
			try {
				const { timestamp } = JSON.parse(dismissedData)
				if (Date.now() - timestamp < ONE_DAY_MS) {
					return
				}
			} catch {
				// Invalid JSON, ignore and continue
			}
		}

		// Detect iOS Safari
		const isIosDevice =
			/Mobi/.test(ua) && /AppleWebKit/.test(ua) && !/Chrom/.test(ua)
		setIsIos(isIosDevice)

		// Show after a brief delay so the user sees the countdown first
		const timeoutId = setTimeout(() => {
			mixpanel.track('install notification shown', { context: 'normal' })
			setIsVisible(true)
		}, 3000)

		return () => clearTimeout(timeoutId)
	}, [])

	const handleDismiss = () => {
		if (inAppBrowser) {
			sessionStorage.setItem('tc_inapp_banner_dismissed', '1')
		} else {
			localStorage.setItem(
				'tc_install_banner_dismissed',
				JSON.stringify({ timestamp: Date.now() })
			)
		}
		setIsVisible(false)
		mixpanel.track('click close install notification', {
			context: inAppBrowser ? 'in_app_browser' : 'normal',
		})
	}

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href)
		} catch {
			const input = document.createElement('input')
			input.value = window.location.href
			document.body.appendChild(input)
			input.select()
			document.execCommand('copy')
			document.body.removeChild(input)
		}
		setCopied(true)
		mixpanel.track('click copy link install notification')
		setTimeout(() => setCopied(false), 2000)
	}

	if (!isVisible) return null

	const appName = inAppBrowser === 'unknown' ? 'this app' : inAppBrowser
	const browserName = /iPhone|iPad|iPod/.test(window.navigator.userAgent)
		? 'Safari'
		: 'Chrome'

	return (
		<div className="fixed bottom-0 w-full lg:hidden [@media(display-mode:standalone)]:hidden">
			<div
				className={cn(
					'relative p-4 text-white max-w-[500px] lg:max-w-[750px] mx-auto',
					className
				)}
			>
				<button
					className="absolute top-0 right-0 p-1"
					onClick={handleDismiss}
					aria-label="Dismiss"
				>
					<svg
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

				{inAppBrowser ? (
					<>
						<p className="text-center font-medium">
							Never miss a game. Add this to your home screen
						</p>
						<p className="text-center text-sm mt-1 text-white/80">
							You&apos;re in {appName}. To add this to your home screen, open
							this page in {browserName} first.
						</p>
						<div className="flex mt-3 justify-center">
							<Button onClick={handleCopyLink} className="min-w-[140px]">
								{copied ? 'Copied!' : 'Copy link'}
							</Button>
						</div>
					</>
				) : (
					<>
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
							<div className="mt-3 space-y-1 text-center text-sm">
								<p>
									<span className="font-medium">1.</span> Tap the share button{' '}
									<IosShareIcon className="inline" /> at the bottom of Safari
								</p>
								<p>
									<span className="font-medium">2.</span> Tap &ldquo;Add to Home
									Screen&rdquo;
								</p>
							</div>
						) : null}
					</>
				)}
			</div>
		</div>
	)
}
