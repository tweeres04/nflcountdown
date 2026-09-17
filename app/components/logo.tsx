import { cn } from '~/lib/utils'

// League/team logo. Callers set the size via className. alt defaults to
// empty for the decorative use beside a team name; the hero logo passes a
// real one.
// fallbackSrc covers teams whose logo doesn't exist yet (e.g. WWC nations
// before their flags are added): swap to the league logo instead of
// showing a broken image.
export default function Logo({
	src,
	fallbackSrc,
	className,
	alt = '',
}: {
	src: string
	fallbackSrc?: string
	className?: string
	alt?: string
}) {
	return (
		<img
			src={src}
			alt={alt}
			className={cn('shrink-0 object-contain', className)}
			onError={
				fallbackSrc
					? (e) => {
							e.currentTarget.onerror = null
							e.currentTarget.src = fallbackSrc
					  }
					: undefined
			}
		/>
	)
}
