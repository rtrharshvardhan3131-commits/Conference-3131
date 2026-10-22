function kolkataParts(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00+05:30`)
  const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }).format(date)
  const month = new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "Asia/Kolkata" }).format(date)
  const year = new Intl.DateTimeFormat("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" }).format(date)
  return { day, month, year }
}

export function formatEventRange(startDate: string, endDate: string): string {
  const start = kolkataParts(startDate)
  const end = kolkataParts(endDate)
  if (start.month === end.month && start.year === end.year) {
    return `${start.day}–${end.day} ${start.month} ${start.year}`
  }
  return `${start.day} ${start.month} ${start.year} – ${end.day} ${end.month} ${end.year}`
}

export function formatLongDate(isoDate: string): string {
  const { day, month, year } = kolkataParts(isoDate)
  return `${day} ${month} ${year}`
}

export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
