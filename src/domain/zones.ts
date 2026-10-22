export const DISTRICT_ZONES = [
  "Zone 1",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
  "Zone 6",
  "Zone 7",
] as const

const zones = new Set<string>(DISTRICT_ZONES)

export function isDistrictZone(value: string): boolean {
  return zones.has(value)
}
