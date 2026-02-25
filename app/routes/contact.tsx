import { type MetaFunction } from '@remix-run/node'
import { Form, useSearchParams } from '@remix-run/react'
import Footer from '~/components/footer'
import { Button } from '~/components/ui/button'

export const meta: MetaFunction = () => {
	const title = 'Contact - Team Countdown'
	const description =
		'Get in touch with Team Countdown. I love hearing from sports fans.'
	const url = 'https://teamcountdown.com/contact'

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

export default function Contact() {
	const [searchParams] = useSearchParams()
	const feedbackSent = searchParams.get('feedback_sent') === 'true'

	return (
		<>
			<div className="flex flex-col min-h-screen">
				<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto space-y-8 pb-20 grow">
					<div className="space-y-2">
						<a href="/" className="content-link stone text-sm">
							&larr; Team Countdown
						</a>
						<h1 className="text-3xl">Contact me</h1>
					</div>

					<div className="space-y-6 text-stone-700 text-[0.9rem] leading-relaxed">
						<section className="space-y-2">
							<p>
								I love hearing from sports fans. If you have feedback, found a
								bug, or just want to say hi, drop me a message.
							</p>
						</section>

						{feedbackSent ? (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<p className="text-green-800 font-medium">
									Thanks for your message! I'll get back to you soon.
								</p>
							</div>
						) : (
							<Form method="post" action="/feedback" className="space-y-4">
								<div className="space-y-2">
									<label
										htmlFor="email"
										className="block text-sm font-medium text-stone-900"
									>
										Email (optional)
									</label>
									<input
										type="email"
										id="email"
										name="email"
										placeholder="your@email.com"
										className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent"
									/>
									<p className="text-xs text-stone-500">
										Only needed if you want a reply
									</p>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="message"
										className="block text-sm font-medium text-stone-900"
									>
										Message
									</label>
									<textarea
										id="message"
										name="message"
										required
										rows={6}
										placeholder="What's on your mind?"
										className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent resize-y"
									/>
								</div>

								<Button
									type="submit"
									className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
								>
									Send message
								</Button>
							</Form>
						)}
					</div>
				</div>
				<Footer />
			</div>
		</>
	)
}
