import type { RegistrationSlab } from "@/domain/types"

export function isSlabPurchasable(slab: RegistrationSlab, now: Date): boolean {
  if (slab.status !== "published") return false
  const start = new Date(slab.startsAt).getTime()
  const end = new Date(slab.endsAt).getTime()
  const time = now.getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || time < start || time > end) return false
  if (slab.quantityLimit !== null && slab.quantitySold >= slab.quantityLimit) return false
  return true
}

export function firstRegistrationSlab<T extends { sortOrder: number; pricePaise: number }>(slabs: readonly T[]): T | null {
  return slabs.slice().sort((left, right) => left.sortOrder - right.sortOrder || left.pricePaise - right.pricePaise)[0] ?? null
}

export function activeSlabs(slabs: readonly RegistrationSlab[], now: Date): RegistrationSlab[] {
  return slabs
    .filter((slab) => isSlabPurchasable(slab, now))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.pricePaise - b.pricePaise)
}

export function quoteSlab(slab: RegistrationSlab, now: Date): { amountPaise: number } | { error: "slab_unavailable" } {
  if (!isSlabPurchasable(slab, now)) return { error: "slab_unavailable" }
  return { amountPaise: slab.pricePaise }
}
