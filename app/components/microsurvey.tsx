import { useEffect, useState, useRef } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import mixpanel from 'mixpanel-browser'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000

const ANSWER_OPTIONS = [
	'Google search',
	'Typed the URL / bookmark',
	'Home screen app',
	'Chrome suggestion',
	'Someone shared it with me',
]

export default function Microsurvey() {
	const [isOpen, setIsOpen] = useState(false)
	const [showOtherInput, setShowOtherInput] = useState(false)
	const [otherText, setOtherText] = useState('')
	const hasResponded = useRef(false)

	useEffect(() => {
		// Wrap in try/catch to handle localStorage access errors (private browsing, etc.)
		try {
			// Update session tracking
			const lastSessionTs = parseInt(
				localStorage.getItem('tc_last_session_ts') || '0',
				10
			)
			const now = Date.now()

			// If last session was more than 30 minutes ago (or doesn't exist), it's a new session
			if (now - lastSessionTs > SESSION_TIMEOUT_MS) {
				const sessionCount = parseInt(
					localStorage.getItem('tc_session_count') || '0',
					10
				)
				localStorage.setItem('tc_session_count', (sessionCount + 1).toString())
			}
			localStorage.setItem('tc_last_session_ts', now.toString())

			// Check if we should show the microsurvey
			const sessionCount = parseInt(
				localStorage.getItem('tc_session_count') || '0',
				10
			)

		// 1. Need at least 2 sessions
		if (sessionCount < 2) {
			return
		}

		// 2. Check if already responded (3-month snooze)
		const respondedData = localStorage.getItem('tc_microsurvey_responded')
		if (respondedData) {
			try {
				const { timestamp } = JSON.parse(respondedData)
				if (now - timestamp < THREE_MONTHS_MS) {
					return
				}
			} catch {
				// Invalid JSON, ignore and continue
			}
		}

		// 3. Check if dismissed (7-day snooze)
		const dismissedData = localStorage.getItem('tc_microsurvey_dismissed')
		if (dismissedData) {
			try {
				const { timestamp } = JSON.parse(dismissedData)
				if (now - timestamp < SEVEN_DAYS_MS) {
					return
				}
			} catch {
				// Invalid JSON, ignore and continue
			}
		}

		// 4. Check if install banner would be showing (priority conflict)
		// Install banner shows if: page views >= 2, not dismissed (or dismiss expired), not standalone
		// NOTE: The install banner increments page views before checking, so we add 1 to match its logic
		const pageViews = parseInt(
			localStorage.getItem('tc_page_view_count') || '0',
			10
		)
		const newPageViews = pageViews + 1
		const installBannerDismissedData = localStorage.getItem(
			'tc_install_banner_dismissed'
		)
		const isStandalone = window.matchMedia('(display-mode: standalone)')
			.matches

		// Check if install banner dismiss has expired (7-day snooze)
		let installBannerWouldShow = false
		if (newPageViews >= 2 && !isStandalone) {
			if (!installBannerDismissedData) {
				// Never dismissed
				installBannerWouldShow = true
			} else {
				// Check if dismiss expired
				try {
					const { timestamp } = JSON.parse(installBannerDismissedData)
					if (now - timestamp >= SEVEN_DAYS_MS) {
						// Dismiss expired — banner will show again
						installBannerWouldShow = true
					}
				} catch {
					// Invalid JSON — treat as not dismissed
					installBannerWouldShow = true
				}
			}
		}

		// If install banner would be showing, don't show microsurvey
		if (installBannerWouldShow) {
			return
		}

		// All checks passed, show the microsurvey after a brief delay (better UX)
		const timeoutId = setTimeout(() => {
			mixpanel.track('attribution survey shown')
			setIsOpen(true)
		}, 2000) // 2 second delay

		return () => clearTimeout(timeoutId)
		} catch (error) {
			// localStorage access error (private browsing, etc.) — silently fail
			console.error('Microsurvey failed to initialize:', error)
		}
	}, [])

	const handleAnswer = (answer: string) => {
		hasResponded.current = true
		mixpanel.track('attribution survey response', { answer })
		localStorage.setItem(
			'tc_microsurvey_responded',
			JSON.stringify({ timestamp: Date.now() })
		)
		setIsOpen(false)
	}

	const handleOtherClick = () => {
		setShowOtherInput(true)
	}

	const handleOtherSubmit = () => {
		if (otherText.trim()) {
			hasResponded.current = true
			mixpanel.track('attribution survey response', {
				answer: 'Other',
				detail: otherText.trim(),
			})
			localStorage.setItem(
				'tc_microsurvey_responded',
				JSON.stringify({ timestamp: Date.now() })
			)
			setIsOpen(false)
		}
	}

	const handleDismiss = () => {
		mixpanel.track('attribution survey dismissed')
		localStorage.setItem(
			'tc_microsurvey_dismissed',
			JSON.stringify({ timestamp: Date.now() })
		)
		setIsOpen(false)
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !hasResponded.current) {
					handleDismiss()
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>How did you find this site?</DialogTitle>
					<DialogDescription>
						This helps me improve the site for fans like you.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
				{ANSWER_OPTIONS.map((option) => (
					<Button
						key={option}
						variant="secondary"
						onClick={() => handleAnswer(option)}
					>
						{option}
					</Button>
				))}
				{!showOtherInput ? (
					<Button variant="secondary" onClick={handleOtherClick}>
						Other
					</Button>
					) : (
						<div className="flex gap-2">
							<Input
								placeholder="Tell us how..."
								value={otherText}
								onChange={(e) => setOtherText(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleOtherSubmit()
									}
								}}
								autoFocus
							/>
						<Button variant="secondary" className="justify-center" onClick={handleOtherSubmit} disabled={!otherText.trim()}>
							Send
						</Button>
						</div>
					)}
				</div>
			<Button variant="secondary" className="justify-center" onClick={handleDismiss}>
				Skip
			</Button>
			</DialogContent>
		</Dialog>
	)
}
