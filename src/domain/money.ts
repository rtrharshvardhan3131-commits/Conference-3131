export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees < 0) {
    throw new Error("Amount must be a positive number of rupees.")
  }
  return Math.round(rupees * 100)
}

export function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export function pricesMatch(expectedPaise: number, receivedPaise: number): boolean {
  return Number.isInteger(expectedPaise) && expectedPaise > 0 && expectedPaise === receivedPaise
}
