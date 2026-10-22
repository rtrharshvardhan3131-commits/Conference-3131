import { formatInrFromPaise } from "@/domain/money"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function ReportsPage() {
  const actor = await requirePermission("view_reports")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Reports" />
  const supabase = await createServerSupabase()
  const { data: registrations } = await supabase.from("registrations").select("status, amount_paise, club, dietary_preference, slab_name_snapshot, district_zone, created_at")
  const { data: payments } = await supabase.from("payments").select("status, amount_paise, provider, reconciliation_status")
  const rows = registrations ?? []
  const verified = (payments ?? []).filter((payment) => payment.status === "captured" && payment.provider !== "simulation")
  const refunded = (payments ?? []).filter((payment) => payment.status === "refunded")
  const gross = verified.reduce((sum, payment) => sum + payment.amount_paise, 0)
  const refundTotal = refunded.reduce((sum, payment) => sum + payment.amount_paise, 0)
  const finance = actor.roles.includes("finance_admin") || actor.roles.includes("super_admin")
  const clubs = new Map<string, { club: string; total: number; confirmed: number; pending: number }>()
  const slabs = new Map<string, { name: string; total: number; confirmed: number }>()
  const diets = new Map<string, number>()
  const statuses = new Map<string, number>()
  for (const row of rows) {
    const club = row.club?.trim() || "No club entered"
    const clubRow = clubs.get(club) ?? { club, total: 0, confirmed: 0, pending: 0 }
    clubRow.total += 1
    if (row.status === "confirmed") clubRow.confirmed += 1
    if (row.status === "pending_payment") clubRow.pending += 1
    clubs.set(club, clubRow)

    const slab = row.slab_name_snapshot?.trim() || "No slab"
    const slabRow = slabs.get(slab) ?? { name: slab, total: 0, confirmed: 0 }
    slabRow.total += 1
    if (row.status === "confirmed") slabRow.confirmed += 1
    slabs.set(slab, slabRow)

    statuses.set(row.status, (statuses.get(row.status) ?? 0) + 1)
    if (row.status === "confirmed") {
      const diet = row.dietary_preference?.trim() || "Not recorded"
      diets.set(diet, (diets.get(diet) ?? 0) + 1)
    }
  }
  const clubRows = [...clubs.values()].sort((left, right) => right.confirmed - left.confirmed || left.club.localeCompare(right.club))
  const slabRows = [...slabs.values()].sort((left, right) => right.confirmed - left.confirmed || left.name.localeCompare(right.name))
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Reports</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="border border-line p-5"><dt>Verified collections</dt><dd className="font-serif text-4xl">{formatInrFromPaise(gross)}</dd></div>
        <div className="border border-line p-5"><dt>Refunded</dt><dd className="font-serif text-4xl">{formatInrFromPaise(refundTotal)}</dd></div>
        <div className="border border-line p-5"><dt>Net collected</dt><dd className="font-serif text-4xl">{formatInrFromPaise(gross - refundTotal)}</dd></div>
        <div className="border border-line p-5"><dt>Checked-in records live on the registration export</dt><dd className="mt-2 text-slate">{rows.length} registrations in view</dd></div>
      </dl>
      <div className="mt-8 flex flex-wrap gap-4">
        <a className="inline-flex min-h-11 items-center border border-navy px-4" href="/api/admin/exports/registrations">Registration CSV</a>
        {finance ? <a className="inline-flex min-h-11 items-center border border-navy px-4" href="/api/admin/exports/payments">Payment CSV</a> : null}
      </div>
      <h2 className="mt-12 font-serif text-3xl text-navy">By club</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {clubRows.map((row) => (
          <li key={row.club} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-6">
            <span>{row.club}</span>
            <span className="text-sm text-slate">{row.total} registered</span>
            <span className="text-sm text-slate">{row.confirmed} confirmed</span>
            <span className="text-sm text-slate">{row.pending} awaiting payment</span>
          </li>
        ))}
        {clubRows.length === 0 ? <li className="py-3 text-slate">No registrations yet.</li> : null}
      </ul>
      <h2 className="mt-12 font-serif text-3xl text-navy">By slab and status</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {slabRows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-4 py-3">
            <span>{row.name}</span>
            <span className="text-sm text-slate">{row.confirmed} confirmed of {row.total}</span>
          </li>
        ))}
        {[...statuses.entries()].map(([status, count]) => (
          <li key={status} className="flex items-center justify-between gap-4 py-3">
            <span className="capitalize">{status.replaceAll("_", " ")}</span>
            <span className="text-sm text-slate">{count}</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 font-serif text-3xl text-navy">Catering from confirmed dietary answers</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {[...diets.entries()].map(([diet, count]) => (
          <li key={diet} className="flex items-center justify-between gap-4 py-3">
            <span>{diet}</span>
            <span className="text-sm text-slate">{count}</span>
          </li>
        ))}
        {diets.size === 0 ? <li className="py-3 text-slate">No confirmed dietary answers yet.</li> : null}
      </ul>
    </section>
  )
}
