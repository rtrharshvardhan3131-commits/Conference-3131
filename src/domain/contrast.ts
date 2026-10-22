const WHITE = "#ffffff"

/** Sampled from the opaque pixels of public/images/rotaract-district-3131.png. */
export const CRANBERRY = "#d22163"

/** Hover shade of the logo cranberry. White text still clears WCAG AA. */
export const CRANBERRY_DEEP = "#a41a4d"

export const AA_TEXT_CONTRAST = 4.5

function channel(value: number): number {
  const unit = value / 255
  return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
}

function parseHex(hex: string): [number, number, number] {
  const match = /^#([\da-f]{6})$/i.exec(hex.trim())
  if (!match?.[1]) throw new Error(`Expected a #rrggbb colour, received ${hex}`)
  const value = Number.parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex)
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsAaText(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= AA_TEXT_CONTRAST
}

export function cranberryPairsMeetAa(): boolean {
  return meetsAaText(WHITE, CRANBERRY) && meetsAaText(WHITE, CRANBERRY_DEEP)
}
