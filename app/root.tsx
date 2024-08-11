import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useParams,
} from '@remix-run/react'
import './tailwind.css'
import { cn } from './lib/utils'
import { createContext, useEffect, useState } from 'react'

export interface BeforeInstallPromptEvent extends Event {
	prompt: () => void
}

export const DeferredInstallPromptContext = createContext<
	BeforeInstallPromptEvent | undefined
>(undefined)

function useDeferredInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent>()

	useEffect(() => {
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
		})
	}, [])

	return { deferredPrompt }
}

export function Layout({ children }: { children: React.ReactNode }) {
	const { teamAbbrev } = useParams()
	const lowercaseAbbreviation = teamAbbrev?.toLowerCase()
	const gradientClass = `bg-fixed bg-gradient-to-b from-${lowercaseAbbreviation} to-${lowercaseAbbreviation}-secondary`

	const { deferredPrompt } = useDeferredInstallPrompt()

	return (
		<html lang="en" className="text-[20px]">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link
					rel="icon"
					type="image/png"
					href={
						teamAbbrev ? `/logos/${lowercaseAbbreviation}.svg` : '/football.png'
					}
				></link>
				<link // png fallback for shit browsers
					rel="icon"
					type="image/png"
					href={
						teamAbbrev ? `/logos/${lowercaseAbbreviation}.png` : '/football.png'
					}
				></link>
				{teamAbbrev ? (
					<link rel="manifest" href={`/${teamAbbrev.toLowerCase()}/manifest`} />
				) : null}
				<Meta />
				<Links />
			</head>
			<body
				className={cn('font-sans', teamAbbrev ? gradientClass : 'bg-stone-100')}
			>
				<DeferredInstallPromptContext.Provider value={deferredPrompt}>
					{children}
				</DeferredInstallPromptContext.Provider>
				<ScrollRestoration />
				<Scripts />
				{/* Google tag (gtag.js) */}
				{process.env.NODE_ENV === 'production' ? (
					<>
						<script
							async
							src="https://www.googletagmanager.com/gtag/js?id=G-KK8MSJMC9Z"
						></script>
						<script>
							{`window.dataLayer = window.dataLayer || [];
					function gtag(){dataLayer.push(arguments);}
					gtag('js', new Date());

					gtag('config', 'G-KK8MSJMC9Z');`}
						</script>
					</>
				) : null}
			</body>
		</html>
	)
}

export default function App() {
	return <Outlet />
}
