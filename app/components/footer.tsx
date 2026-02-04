import { cn } from '~/lib/utils'

interface FooterProps {
	league?: string
	countdown?: boolean
}

export default function Footer({ league, countdown = false }: FooterProps) {
	return (
		<footer
			className={cn(
				countdown ? 'text-white text-center' : 'py-10 bg-stone-200'
			)}
		>
			<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto text-sm">
				<p className={cn('flex', countdown ? 'justify-around' : 'gap-3')}>
					<a
						href="/"
						className={cn('content-link', countdown ? null : 'stone')}
					>
						Team Countdown
					</a>
					<a
						href="https://tweeres.ca"
						className={cn('content-link', countdown ? null : 'stone')}
					>
						By Tyler Weeres
					</a>
				</p>
				{countdown ? null : (
					<div className="space-y-2 mt-5">
						{/* <p className="text-xs text-stone-600">
							This site contains affiliate links. We may earn a commission if
							you make a purchase through these links at no additional cost to
							you.
						</p>
						<p className="text-xs text-stone-600">
							21+ for betting links. Gambling problem? Call{' '}
							<a
								href="tel:1-800-GAMBLER"
								className={cn('content-link', countdown ? null : 'stone')}
							>
								1-800-GAMBLER
							</a>
						</p> */}
						<p className="text-xs text-stone-600">
							Team names, logos, and trademarks are the property of their
							respective owners. This site is not affiliated with or endorsed by
							the NFL, NBA, WNBA, MLB, NHL, MLS, or any team.
						</p>
					</div>
				)}
			</div>
		</footer>
	)
}
