import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '~/lib/utils'

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(
					'w-full lg:w-auto justify-center border-2 rounded-sm border-white px-5 py-2 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2',
					className
				)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Button.displayName = 'Button'

export { Button }
