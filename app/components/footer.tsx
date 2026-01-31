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
				<p>
					<a
						href="https://tweeres.ca"
						className={cn('content-link', countdown ? null : 'stone')}
					>
						By Tyler Weeres
					</a>
				</p>
				{league && (
					<p className="mt-2">
						{league === 'MLB' ? (
							<>
								Baseball icons created by{' '}
								<a
									href="https://www.flaticon.com/free-icons/baseball"
									title="baseball icons"
									className={cn('content-link', countdown ? null : 'stone')}
								>
									Freepik - Flaticon
								</a>
							</>
						) : league === 'NBA' ? (
							<>
								Basketball icons created by{' '}
								<a
									href="https://www.flaticon.com/free-icons/basketball"
									title="basketball icons"
									className={cn('content-link', countdown ? null : 'stone')}
								>
									Freepik - Flaticon
								</a>
							</>
						) : (
							<>
								American football icon created by{' '}
								<a
									href="https://www.flaticon.com/free-icons/american-football"
									title="american football icons"
									className={cn('content-link', countdown ? null : 'stone')}
								>
									Smashicons - Flaticon
								</a>
							</>
						)}
					</p>
				)}
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
							the NFL, NBA, MLB, or any team.
						</p>
					</div>
				)}
			</div>
		</footer>
	)
}
