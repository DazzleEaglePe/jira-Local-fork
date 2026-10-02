import type {ClassValue} from 'clsx'
import {clsx} from 'clsx'
import {extendTailwindMerge} from 'tailwind-merge'

// Tailwind is configured with the `tw` prefix (see styles/tailwind.css)
const twMerge = extendTailwindMerge({prefix: 'tw'})

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
