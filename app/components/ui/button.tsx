import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

const buttonVariants = cva(
	'flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 transition-colors',
	{
		variants: {
			variant: {
				default:
					'w-full lg:w-auto justify-center border-2 rounded-sm border-white',
				affiliate:
					'w-full lg:w-auto justify-center rounded-sm hover:bg-white/20',
				secondary: 'justify-start rounded-sm hover:bg-stone-200 text-stone-900',
			},
			size: {
				default: 'px-5 py-2',
				sm: 'px-2 py-3 text-xs',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(buttonVariants({ variant, size }), className)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Button.displayName = 'Button'

export { Button, buttonVariants }
