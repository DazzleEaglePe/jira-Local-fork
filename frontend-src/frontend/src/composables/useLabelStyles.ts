import type {Label} from '@/client/generated'

export function getLabelColor(label: Label): string {
	const color = label.hex_color ?? ''
	if (color === '' || color.startsWith('#') || color.startsWith('var(')) {
		return color
	}

	return `#${color}`
}

export function useLabelStyles() {
	function getLabelStyles(label: Label) {
		const color = getLabelColor(label)
		if (!color) {
			return {
				'background': 'var(--grey-100)',
				'color': 'var(--grey-700)',
				'border': '1px solid var(--grey-200)',
			}
		}

		return {
			'background': `color-mix(in srgb, ${color} 14%, var(--white))`,
			'color': `color-mix(in srgb, ${color} 85%, var(--text-strong))`,
			'border': `1px solid color-mix(in srgb, ${color} 35%, var(--border))`,
			'font-weight': '600',
		}
	}

	return {
		getLabelStyles,
	}
}
