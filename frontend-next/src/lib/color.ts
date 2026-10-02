/** "#rrggbb" from Vikunja colors ("" | "rrggbb" | "#rrggbb"); undefined when unset. */
export function toHex(color?: string | null): string | undefined {
  if (!color || color === "#") return undefined
  const hex = color.startsWith("#") ? color : `#${color}`
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : undefined
}

/** WCAG relative luminance of a #rrggbb color. */
export function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
  const [r, g, b] = channels.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Text color with the better WCAG contrast on the given background. */
export function readableTextColor(background: string): "#000000" | "#ffffff" {
  const bg = luminance(background)
  const contrastWithWhite = 1.05 / (bg + 0.05)
  const contrastWithBlack = (bg + 0.05) / 0.05
  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff"
}
