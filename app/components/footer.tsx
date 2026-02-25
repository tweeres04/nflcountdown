import { cn } from '~/lib/utils'

interface FooterProps {
	league?: string
	dark?: boolean
}

export default function Footer({ league, dark = false }: FooterProps) {
	return (
		<footer
			className={cn(
				dark ? 'text-white text-center' : 'py-10 bg-stone-200'
			)}
		>
			<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto text-sm">
				<p className={cn('flex', dark ? 'justify-around' : 'gap-3')}>
					<a
						href="/"
						className={cn('content-link', dark ? null : 'stone')}
					>
						Team Countdown
					</a>
					<a
						href="https://tweeres.ca"
						className={cn('content-link', dark ? null : 'stone')}
					>
						By Tyler Weeres
					</a>
				</p>
				<div className="space-y-2 mt-5">
					<div className={cn('flex flex-wrap gap-x-3 gap-y-1', dark ? 'justify-center' : '')}>
						<a href="/about" className={cn('content-link text-xs', dark ? null : 'stone')}>
							About
						</a>
						<a href="/contact" className={cn('content-link text-xs', dark ? null : 'stone')}>
							Contact
						</a>
						<a href="/privacy" className={cn('content-link text-xs', dark ? null : 'stone')}>
							Privacy
						</a>
						<a href="/terms" className={cn('content-link text-xs', dark ? null : 'stone')}>
							Terms
						</a>
					</div>
					{dark ? null : (
						<>
							<p className="text-xs text-stone-600">
								This site contains affiliate links. I may earn a commission if
								you make a purchase through these links at no additional cost to
								you.
							</p>
							<p className="text-xs text-stone-600">
								21+ for betting links. Gambling problem? Call{' '}
								<a
									href="tel:1-800-GAMBLER"
									className="content-link stone"
								>
									1-800-GAMBLER
								</a>
							</p>
						</>
					)}
				<p className={cn('text-xs', dark ? 'text-white/70' : 'text-stone-600')}>
					Team names, logos, and trademarks are the property of their
					respective owners. This site is not affiliated with or endorsed by
					the NFL, NBA, WNBA, MLB, NHL, MLS, or any team.
				</p>
				<p className={cn('text-xs', dark ? 'text-white/70' : 'text-stone-500')}>
						© 2026 Team Countdown
					</p>
				</div>
			</div>
		</footer>
	)
}
