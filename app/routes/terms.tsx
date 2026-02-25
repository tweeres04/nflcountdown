import { type MetaFunction } from '@remix-run/node'
import Footer from '~/components/footer'

export const meta: MetaFunction = () => {
	const title = 'Terms of Service - Team Countdown'
	const description =
		'Terms of service for teamcountdown.com. Please read these terms before using the site.'
	const url = 'https://teamcountdown.com/terms'

	return [
		{ title },
		{ name: 'description', content: description },
		{ property: 'og:title', content: title },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:url', content: url },
		{ property: 'og:description', content: description },
		{ property: 'og:site_name', content: 'Team Countdown' },
		{ tagName: 'link', rel: 'canonical', href: url },
	]
}

export default function Terms() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-8 pb-20 grow">
					<div className="space-y-2">
						<a href="/" className="content-link stone text-sm">
							&larr; Team Countdown
						</a>
						<h1 className="text-3xl">Terms of service</h1>
						<p className="text-sm text-stone-500">
							Last updated: February 6, 2026
						</p>
					</div>

					<div className="space-y-6 text-stone-700 text-[0.9rem] leading-relaxed">
						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Acceptance of terms</h2>
							<p>
								By accessing and using teamcountdown.com (the "Site"), you
								accept and agree to be bound by these terms of service. If you
								do not agree to these terms, please do not use the Site.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Description of service</h2>
							<p>
								Team Countdown provides countdown timers for upcoming sports
								games across the NFL, NBA, WNBA, MLB, NHL, and MLS. The Site
								also provides game schedules, team information, and links to
								third-party services.
							</p>
							<p>
								I strive to provide accurate information but make no guarantees
								about the accuracy, completeness, or timeliness of game
								schedules, scores, or other information displayed on the Site.
								Always verify game times with official league sources.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Intellectual property</h2>
							<p>
								Team names, logos, and trademarks displayed on this Site are the
								property of their respective owners. This Site is not affiliated
								with or endorsed by the NFL, NBA, WNBA, MLB, NHL, MLS, or any
								professional sports team.
							</p>
							<p>
								The design, layout, and content created by Team Countdown are
								protected by copyright. You may not copy, reproduce, or
								redistribute any original content from this Site without
								permission.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">User conduct</h2>
							<p>You agree not to:</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>Use the Site for any unlawful purpose</li>
								<li>
									Attempt to gain unauthorized access to any part of the Site or
									its servers
								</li>
								<li>
									Interfere with or disrupt the operation of the Site or servers
									hosting it
								</li>
								<li>
									Use automated tools (bots, scrapers) to access the Site
									without permission
								</li>
							</ul>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Affiliate links</h2>
							<p>
								This Site contains affiliate links to third-party services such
								as ticket sellers, sports betting sites, and merchandise stores.
								I may earn a commission if you make a purchase through these
								links at no additional cost to you.
							</p>
							<p>
								I am not responsible for the products, services, or conduct of
								these third parties. Your use of third-party sites is at your
								own risk and subject to their terms and conditions.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">
								Disclaimers and limitation of liability
							</h2>
							<p>
								The Site is provided on an "as is" and "as available" basis. I
								make no warranties, express or implied, regarding the Site's
								operation, availability, or accuracy of information.
							</p>
							<p>
								To the fullest extent permitted by law, I disclaim all liability
								for any damages arising from your use of the Site, including
								direct, indirect, incidental, or consequential damages.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Gambling disclaimer</h2>
							<p>
								Some links on this Site direct to sports betting and gambling
								sites. Gambling involves risk and may not be legal in your
								jurisdiction. You must be 21 or older to use sports betting
								sites. If you have a gambling problem, call{' '}
								<a href="tel:1-800-GAMBLER" className="content-link stone">
									1-800-GAMBLER
								</a>
								.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Changes to these terms</h2>
							<p>
								I may update these terms from time to time. Any changes will be
								posted on this page with an updated "last updated" date.
								Continued use of the Site after changes constitutes acceptance
								of the new terms.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Governing law</h2>
							<p>
								These terms are governed by the laws of the Province of British
								Columbia, Canada, without regard to conflict of law principles.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Contact me</h2>
							<p>
								If you have questions about these terms, you can reach me
								through the{' '}
								<a href="/contact" className="content-link stone">
									contact page
								</a>
								.
							</p>
						</section>
					</div>
				</div>
				<Footer />
			</div>
		</>
	)
}
