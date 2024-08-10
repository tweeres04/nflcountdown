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

export function Layout({ children }: { children: React.ReactNode }) {
	const { teamAbbrev } = useParams()
	const lowercaseAbbreviation = teamAbbrev?.toLowerCase()
	const gradientClass = `bg-fixed bg-gradient-to-b from-${lowercaseAbbreviation} to-${lowercaseAbbreviation}-secondary`
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
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	return <Outlet />
}
