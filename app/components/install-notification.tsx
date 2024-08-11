import { useContext, useEffect, useState } from 'react'
import IosShareIcon from './IosShareIcon'

import { DeferredInstallPromptContext } from '~/root'

export default function InstallNotification({
	fullTeamName,
	lowercaseAbbreviation,
}: {
	fullTeamName: string
	lowercaseAbbreviation: string
}) {
	const [showInstallNotification, setShowInstallNotification] = useState(false)
	const [isIos, setIsIos] = useState(false)
	const deferredInstallPrompt = useContext(DeferredInstallPromptContext)

	console.log({ deferredInstallPrompt })

	useEffect(() => {
		const isStandalone = window.matchMedia('(display-mode: standalone)').matches
		setShowInstallNotification(!isStandalone)
	}, [])

	useEffect(() => {
		// From https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
		setIsIos(
			/Mobi/.test(window.navigator.userAgent) &&
				/AppleWebKit/.test(window.navigator.userAgent) &&
				!/Chrom/.test(window.navigator.userAgent)
		)
	}, [])

	return showInstallNotification ? (
		<div className="fixed bottom-0 w-full">
			<div
				className={`relative p-4 text-white bg-${lowercaseAbbreviation} max-w-[500px] lg:max-w-[750px] mx-auto`}
			>
				<button
					className="absolute top-0 right-0 p-1"
					onClick={() => {
						setShowInstallNotification(false)
					}}
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
				<p className="has-text-centered">
					Install {fullTeamName} Countdown to your home screen for quick access
				</p>
				{deferredInstallPrompt ? (
					<div className="text-center mt-2">
						<button
							className="py-2 px-3 border-2 border-white mx-auto rounded-sm"
							onClick={() => {
								deferredInstallPrompt.prompt()
							}}
						>
							Add to home screen
						</button>
					</div>
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
