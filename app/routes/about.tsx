import { type MetaFunction } from '@remix-run/node'
import Footer from '~/components/footer'

export const meta: MetaFunction = () => {
	const title = 'About - Team Countdown'
	const description =
		'Learn about Team Countdown, the best way to track upcoming games for your favorite sports teams.'
	const url = 'https://teamcountdown.com/about'

	return [
		{ title },
		{ name: 'description', content: description },
		{ name: 'og:title', content: title },
		{ name: 'og:type', content: 'website' },
		{ name: 'og:url', content: url },
		{ name: 'og:description', content: description },
		{ name: 'og:site_name', content: 'Team Countdown' },
		{ tagName: 'link', rel: 'canonical', href: url },
	]
}

export default function About() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-8 pb-20 grow">
					<div className="space-y-2">
						<a href="/" className="content-link stone text-sm">
							&larr; Team Countdown
						</a>
						<h1 className="text-3xl">About Team Countdown</h1>
					</div>

					<div className="space-y-6 text-stone-700 text-[0.9rem] leading-relaxed">
						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">What this is</h2>
							<p>
								Team Countdown helps sports fans track when their favorite teams
								play next. Pick your team, add the countdown to your home
								screen, and watch the clock tick down to game time.
							</p>
							<p>
								I cover the NFL, NBA, WNBA, MLB, NHL, and MLS. Each team page
								shows a live countdown timer, the full season schedule, and
								links to buy tickets or watch the game.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Why I built this</h2>
							<p>
								As a sports fan, I was constantly googling "when is the next
								Canucks game?" and wading through cluttered sports news sites
								just to find a simple answer.
							</p>
							<p>
								Team Countdown cuts through the noise. No autoplaying videos, no
								pop-ups, no unnecessary content. Just a clean countdown timer
								and the information you need.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">How it works</h2>
							<p>
								I pull game schedules from official league sources and keep them
								updated throughout the season. The countdown timer runs in your
								browser and updates every second.
							</p>
							<p>
								You can add any team page to your phone's home screen as a
								progressive web app. It works offline and feels like a native
								app.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Who runs this</h2>
							<p>
								Team Countdown is built and maintained by{' '}
								<a
									href="https://tweeres.ca"
									target="_blank"
									rel="noopener noreferrer"
									className="content-link stone"
								>
									Tyler Weeres
								</a>
								, a software developer based in Victoria British Columbia,
								Canada.
							</p>
							<p>
								This site started as a side project during hockey season and
								grew into a tool for fans across multiple leagues.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Get in touch</h2>
							<p>
								Have feedback, suggestions, or just want to say hi? Reach out
								through the{' '}
								<a href="/contact" className="content-link stone">
									contact page
								</a>
								.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Disclaimer</h2>
							<p>
								Team Countdown is not affiliated with or endorsed by the NFL,
								NBA, WNBA, MLB, NHL, MLS, or any professional sports team. All
								team names, logos, and trademarks are the property of their
								respective owners.
							</p>
						</section>
					</div>
				</div>
				<Footer />
			</div>
		</>
	)
}
