const formulaPrefix = /^[=+\-@\t\r]/

export function sanitizeCsvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  const guarded = formulaPrefix.test(text) ? `'${text}` : text
  if (/[",\n\r]/.test(guarded)) return `"${guarded.replaceAll('"', '""')}"`
  return guarded
}

export function toCsv(headers: readonly string[], rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  const lines = [headers.map((header) => sanitizeCsvCell(header)).join(",")]
  for (const row of rows) {
    lines.push(row.map((cell) => sanitizeCsvCell(cell)).join(","))
  }
  return `${lines.join("\r\n")}\r\n`
}
