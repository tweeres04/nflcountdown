import { type MetaFunction } from '@remix-run/node'
import Footer from '~/components/footer'

export const meta: MetaFunction = () => {
	const title = 'Privacy Policy - Team Countdown'
	const description =
		'Privacy policy for teamcountdown.com. Learn how I collect, use, and protect your information.'
	const url = 'https://teamcountdown.com/privacy'

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

export default function Privacy() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-8 pb-20 grow">
					<div className="space-y-2">
						<a href="/" className="content-link stone text-sm">
							&larr; Team Countdown
						</a>
						<h1 className="text-3xl">Privacy policy</h1>
						<p className="text-sm text-stone-500">
							Last updated: February 6, 2026
						</p>
					</div>

					<div className="space-y-6 text-stone-700 text-[0.9rem] leading-relaxed">
						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Overview</h2>
							<p>
								Team Countdown operates teamcountdown.com. This page explains
								what information I collect, how I use it, and your choices
								regarding that information.
							</p>
							<p>
								I keep things simple: I don't require you to create an account,
								I don't collect personal information, and I don't sell data to
								anyone.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Information I collect</h2>
							<p>
								I use analytics tools to understand how people use the site.
								These tools collect anonymous usage data such as:
							</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>Pages visited and time spent on them</li>
								<li>Referring website (how you found the site)</li>
								<li>Browser type and screen size</li>
								<li>General geographic location (country/region level)</li>
							</ul>
							<p>
								I do not collect names, email addresses, or other personal
								information unless you voluntarily submit it through the
								feedback form.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Analytics services</h2>
							<p>I use the following third-party analytics services:</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>
									<strong>Google Analytics</strong> - Helps me understand
									traffic patterns and popular pages. Google's privacy policy is
									available at{' '}
									<a
										href="https://policies.google.com/privacy"
										target="_blank"
										rel="noopener noreferrer"
										className="content-link stone"
									>
										policies.google.com/privacy
									</a>
									.
								</li>
								<li>
									<strong>Simple Analytics</strong> - A privacy-focused
									analytics tool that does not use cookies or collect personal
									data. Learn more at{' '}
									<a
										href="https://simpleanalytics.com/privacy"
										target="_blank"
										rel="noopener noreferrer"
										className="content-link stone"
									>
										simpleanalytics.com/privacy
									</a>
									.
								</li>
								<li>
									<strong>Mixpanel</strong> - Used to track anonymous usage
									events. Mixpanel's privacy policy is available at{' '}
									<a
										href="https://mixpanel.com/legal/privacy-policy"
										target="_blank"
										rel="noopener noreferrer"
										className="content-link stone"
									>
										mixpanel.com/legal/privacy-policy
									</a>
									.
								</li>
							</ul>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Cookies</h2>
							<p>
								Some of the analytics services (Google Analytics, Mixpanel) use
								cookies to track sessions. A cookie is a small text file stored
								in your browser. You can disable cookies in your browser
								settings at any time. Simple Analytics does not use cookies.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Affiliate links</h2>
							<p>
								Some links on this site are affiliate links. When you click an
								affiliate link and make a purchase, I may earn a small
								commission at no extra cost to you. Affiliate partners may use
								their own cookies and tracking. I clearly label affiliate links
								and include disclosures on pages where they appear.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Feedback form</h2>
							<p>
								If you submit feedback through the feedback form, I receive the
								content of your message and your email address (if you choose to
								provide it). I use this solely to read and respond to your
								feedback. I do not add you to any mailing list.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Third-party links</h2>
							<p>
								This site contains links to external websites (ticket sellers,
								sports betting sites, merchandise stores, etc.). I am not
								responsible for the privacy practices of those sites. I
								encourage you to read the privacy policies of any site you
								visit.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Children's privacy</h2>
							<p>
								This site is not directed at children under 13. I do not
								knowingly collect information from children under 13.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Changes to this policy</h2>
							<p>
								I may update this privacy policy from time to time. Any changes
								will be posted on this page with an updated "last updated" date.
							</p>
						</section>

						<section className="space-y-2">
							<h2 className="text-xl text-stone-900">Contact me</h2>
							<p>
								If you have questions about this privacy policy, you can reach
								me through the{' '}
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
