import {
	json,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
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
	return json({
		LEAGUE,
		GTAG_ID,
	})
}

export function Layout({ children }: { children: React.ReactNode }) {
	const { LEAGUE, GTAG_ID } = useLoaderData<typeof loader>() ?? {} // empty object in case we're in an error page
	const { teamAbbrev } = useParams()
	const lowercaseAbbreviation = teamAbbrev?.toLowerCase()
	const lowercaseLeague = LEAGUE?.toLowerCase()
	const color =
		LEAGUE === 'NFL'
			? lowercaseAbbreviation
			: `${lowercaseLeague}-${lowercaseAbbreviation}`
	const gradientClass = `bg-fixed bg-gradient-to-b from-${color} to-${color}-secondary`
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
				<Meta />
				<Links />
			</head>
			<body
				className={cn('font-sans', teamAbbrev ? gradientClass : 'bg-stone-100')}
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
					</>
				) : null}
			</body>
		</html>
	)
}

export default function App() {
	return <Outlet />
}
