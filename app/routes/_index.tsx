import { type MetaFunction } from '@remix-run/node'
import { Button } from '~/components/ui/button'
import { generateWebSiteSchema } from '~/lib/schema-helpers'
import Footer from '~/components/footer'

export const meta: MetaFunction = () => {
	const title = `When is the next game? - Team Countdown`
	const description = `Get pumped for your team's next game. Add the countdown to your home screen and watch the clock tick until game day.`
	const url = `https://teamcountdown.com`

	const metaTags: any[] = [
		{ title },
		{
			name: 'description',
			content: description,
		},
		{ property: 'og:title', content: title },
		{ property: 'og:type', content: 'website' },
		{
			property: 'og:url',
			content: url,
		},
		{
			property: 'og:description',
			content: description,
		},
		{ property: 'og:site_name', content: `Team Countdown` },
		{
			tagName: 'link',
			rel: 'canonical',
			href: url,
		},
		{
			'script:ld+json': generateWebSiteSchema(),
		},
	]

	return metaTags
}

export default function Index() {
	const leagues = [
		{ code: 'nfl', name: 'NFL', fullName: 'National Football League' },
		{ code: 'nba', name: 'NBA', fullName: 'National Basketball Association' },
		{ code: 'wnba', name: 'WNBA', fullName: "Women's National Basketball Association" },
		{ code: 'mlb', name: 'MLB', fullName: 'Major League Baseball' },
		{ code: 'nhl', name: 'NHL', fullName: 'National Hockey League' },
		{ code: 'mls', name: 'MLS', fullName: 'Major League Soccer' },
	]

	return (
		<>
			<div className="flex flex-col min-h-screen md:h-auto">
				<div className="font-sans text-white p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-12 min-h-[600px] grow pb-20">
					<h1 className="text-3xl">Team Countdown</h1>
					<div className="flex flex-col gap-10">
						<div className="space-y-5">
							<div className="space-y-3">
								<h2 className="text-2xl">
									Get pumped for game day
								</h2>
								<p className="text-white/80">
									Pick your team. Add it to your home screen. Watch the days, hours, and minutes tick away until kickoff.
								</p>
							</div>
							<div className="space-y-3">
								<h3 className="text-xl">Choose your league:</h3>
								<div className="flex flex-col gap-3">
									{leagues.map((league) => (
										<a
											key={league.code}
											href={`/${league.code}`}
											className="flex items-center gap-4 py-2 content-link group"
										>
											<img
												src={`/logos/${league.code}.png`}
												alt={`${league.name} logo`}
												className="h-10 w-10 object-contain flex-shrink-0"
											/>
											<div className="flex flex-col items-start gap-0.5">
												<div className="text-base font-semibold text-white">
													{league.name}
												</div>
												<div className="text-sm font-normal text-white/60">
													{league.fullName}
												</div>
											</div>
										</a>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
				<Footer dark />
			</div>
		</>
	)
}
