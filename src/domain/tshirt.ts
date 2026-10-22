export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const

export type TshirtSize = (typeof TSHIRT_SIZES)[number]

export function isTshirtSize(value: string): value is TshirtSize {
  return (TSHIRT_SIZES as readonly string[]).includes(value)
}
