interface FooterProps {
	league?: string
}

export default function Footer({ league }: FooterProps) {
	return (
		<footer className="bg-stone-200">
			<div className="p-4 max-w-[500px] lg:max-w-[750px] mx-auto text-sm space-y-2">
				<p>
					<a
						href="https://tweeres.ca"
						className="content-link hover:text-stone-900 hover:decoration-stone-900"
					>
						By Tyler Weeres
					</a>
				</p>
				<p className="text-xs text-stone-600">
					This site contains affiliate links. We may earn a commission if you
					make a purchase through these links at no additional cost to you.
				</p>
				<p className="text-xs text-stone-600">
					21+ for betting links. Gambling problem? Call{' '}
					<a href="tel:1-800-GAMBLER" className="underline">
						1-800-GAMBLER
					</a>
				</p>
				<p className="text-xs text-stone-600">
					Team names, logos, and trademarks are the property of their respective
					owners. This site is not affiliated with or endorsed by the NFL, NBA,
					MLB, or any team.
				</p>
				{league && (
					<p>
						{league === 'MLB' ? (
							<a
								href="https://www.flaticon.com/free-icons/baseball"
								title="baseball icons"
							>
								Baseball icons created by Freepik - Flaticon
							</a>
						) : league === 'NBA' ? (
							<a
								href="https://www.flaticon.com/free-icons/basketball"
								title="basketball icons"
							>
								Basketball icons created by Freepik - Flaticon
							</a>
						) : (
							<a
								href="https://www.flaticon.com/free-icons/american-football"
								title="american football icons"
							>
								American football icon created by Smashicons - Flaticon
							</a>
						)}
					</p>
				)}
			</div>
		</footer>
	)
}
