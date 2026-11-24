import { participantRoleLabel } from "@/domain/participant-role"

export type DeskRegistrationRow = {
  reference: string
  fullName: string
  phone: string
  club: string | null
  zone: string | null
  status: string
  slabName: string | null
  checkedInAt: string | null
  rotaryId: string | null
  tshirtSize: string | null
  participantRole: string | null
}

const formulaPrefix = /^[=+\-@\t\r]/

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function cell(value: string | number, style?: string) {
  const raw = String(value)
  const guarded = formulaPrefix.test(raw) ? `'${raw}` : raw
  const styleAttr = style ? ` ss:StyleID="${style}"` : ""
  const numeric = typeof value === "number" && !formulaPrefix.test(raw)
  const type = numeric ? "Number" : "String"
  return `<Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(guarded)}</Data></Cell>`
}

function row(values: (string | number)[], style?: string) {
  return `<Row>${values.map((value) => cell(value, style)).join("")}</Row>`
}

function clubName(club: string | null) {
  const name = club?.trim()
  return name ? name : "No club recorded"
}

function statusLabel(status: string) {
  if (status === "pending_payment") return "Awaiting payment"
  if (status === "payment_failed") return "Payment failed"
  if (status === "refund_pending") return "Refund pending"
  return status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())
}

function grouped(rows: readonly DeskRegistrationRow[]) {
  const clubs = new Map<string, DeskRegistrationRow[]>()
  for (const row of rows) {
    const name = clubName(row.club)
    const list = clubs.get(name) ?? []
    list.push(row)
    clubs.set(name, list)
  }
  return [...clubs.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([club, people]) => [club, [...people].sort((left, right) => left.fullName.localeCompare(right.fullName))] as const)
}

export function deskWorkbook(rows: readonly DeskRegistrationRow[]): string {
  const groups = grouped(rows)
  const deskRows = groups.flatMap(([club, people]) => {
    const confirmed = people.filter((person) => person.status === "confirmed").length
    const heading = row([`${club} · ${people.length} registered · ${confirmed} confirmed`], "club")
    const peopleRows = people.map((person) => row([
      person.fullName,
      person.rotaryId ?? "",
      person.reference,
      person.phone,
      participantRoleLabel(person.participantRole ?? ""),
      person.zone ?? "",
      person.tshirtSize ?? "",
      statusLabel(person.status),
      person.checkedInAt ? "Yes" : "No",
      person.slabName ?? "",
    ]))
    return [heading, ...peopleRows, row([""])]
  })
  const totals = groups.map(([club, people]) => row([
    club,
    people.length,
    people.filter((person) => person.status === "confirmed").length,
    people.filter((person) => person.status === "pending_payment").length,
    people.filter((person) => person.checkedInAt).length,
  ]))

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="head"><Font ss:Bold="1" ss:Color="#F6F1E7"/><Interior ss:Color="#0C1424" ss:Pattern="Solid"/></Style>
<Style ss:ID="club"><Font ss:Bold="1" ss:Color="#0C1424"/><Interior ss:Color="#F8E7EE" ss:Pattern="Solid"/></Style>
</Styles>
<Worksheet ss:Name="By club">
<Table>
${row(["Name", "Rotary ID", "Reference", "Mobile", "Role", "Zone", "T-shirt", "Status", "Checked in", "Slab"], "head")}
${deskRows.join("\n")}
</Table>
</Worksheet>
<Worksheet ss:Name="Club totals">
<Table>
${row(["Club", "Registered", "Confirmed", "Awaiting payment", "Checked in"], "head")}
${totals.join("\n")}
</Table>
</Worksheet>
</Workbook>
`
}
