import {
	json,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useLocation,
	useParams,
} from '@remix-run/react'
import './tailwind.css'
import { cn } from './lib/utils'

import {
	DeferredInstallPromptContext,
	useDeferredInstallPrompt,
} from './components/install-notification'

import { LeagueContext } from './lib/league-context'
import { LoaderFunctionArgs } from '@remix-run/node'

export function loader({ request }: LoaderFunctionArgs) {
	const LEAGUE = process.env.LEAGUE ?? 'NFL'
	const url = new URL(request.url)
	if (url.hostname.endsWith('.ca')) {
		url.hostname = `${LEAGUE.toLowerCase()}countdown.tweeres.com`
		return Response.redirect(url.toString(), 308)
	}
	const GTAG_ID = process.env.GTAG_ID
	const AHREFS_KEY = process.env.AHREFS_KEY
	return json({
		LEAGUE,
		GTAG_ID,
		AHREFS_KEY,
	})
}

export function gradientClass(
	lowercaseLeague: string,
	lowercaseAbbreviation: string
) {
	const color =
		lowercaseLeague === 'nfl'
			? lowercaseAbbreviation
			: `${lowercaseLeague}-${lowercaseAbbreviation}`
	return `bg-fixed bg-gradient-to-b from-${color} to-${color}-secondary`
}

export function Layout({ children }: { children: React.ReactNode }) {
	const { LEAGUE, GTAG_ID, AHREFS_KEY } = useLoaderData<typeof loader>() ?? {} // empty object in case we're in an error page
	const { teamAbbrev } = useParams()
	const lowercaseAbbreviation = teamAbbrev?.toLowerCase()
	const lowercaseLeague = LEAGUE?.toLowerCase()
	const gradientClass_ = gradientClass(lowercaseLeague, lowercaseAbbreviation)
	const logo = (filetype: string) =>
		teamAbbrev
			? `/logos/${
					LEAGUE === 'NFL' ? '' : `${lowercaseLeague}/`
			  }${lowercaseAbbreviation}.${filetype}`
			: LEAGUE === 'MLB'
			? `/baseball.${filetype}`
			: LEAGUE === 'NBA'
			? `basketball.${filetype}`
			: `/football.${filetype}`

	const { deferredPrompt } = useDeferredInstallPrompt()

	const location = useLocation()

	const isSeasonCountdown = location.pathname.match(/\/season\/?/)

	return (
		<html lang="en" className="text-[20px]">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" type="image/svg+xml" href={logo('svg')}></link>
				<link // png fallback for shit browsers
					rel="icon"
					type="image/png"
					href={logo('png')}
				></link>
				{teamAbbrev ? (
					<link rel="manifest" href={`/${teamAbbrev.toLowerCase()}/manifest`} />
				) : null}
				{isSeasonCountdown ? (
					<link rel="manifest" href="/season/manifest.json" />
				) : null}
				<Meta />
				<Links />
			</head>
			<body
				className={cn(
					'font-sans',
					teamAbbrev
						? gradientClass_
						: isSeasonCountdown
						? 'bg-stone-900'
						: 'bg-stone-100'
				)}
			>
				<DeferredInstallPromptContext.Provider value={deferredPrompt}>
					<LeagueContext.Provider value={LEAGUE}>
						{children}
					</LeagueContext.Provider>
				</DeferredInstallPromptContext.Provider>
				<ScrollRestoration />
				<Scripts />
				{/* Google tag (gtag.js) */}
				{process.env.NODE_ENV === 'production' ? (
					<>
						<script
							async
							src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
						></script>
						<script
							dangerouslySetInnerHTML={{
								__html: `window.dataLayer = window.dataLayer || [];
									function gtag(){dataLayer.push(arguments);}
									gtag('js', new Date());

									gtag('config', '${GTAG_ID}');`,
							}}
						></script>
						{/* Simple Analytics */}
						<script
							data-collect-dnt="true"
							async
							src="https://scripts.simpleanalyticscdn.com/latest.js"
						></script>
						<script
							src="https://analytics.ahrefs.com/analytics.js"
							data-key={AHREFS_KEY}
							async
						></script>
					</>
				) : null}
			</body>
		</html>
	)
}

export default function App() {
	return <Outlet />
}
