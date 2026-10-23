import Link from "next/link"
import { redirect } from "next/navigation"
import { RegistrationRows } from "@/components/admin/registration-table"
import { formatInrFromPaise } from "@/domain/money"
import { hasPermission, isStaff } from "@/domain/permissions"
import { loadMonitor, monitorTotals } from "@/server/registration-monitor"
import { requireActor } from "@/server/session"

export const instant = false

export default async function AdminHome() {
  const actor = await requireActor()
  if (!isStaff(actor.roles)) redirect("/delegate")
  if (!hasPermission(actor.roles, "view_reports")) {
    return (
      <section>
        <p className="eyebrow">Committee desk</p>
        <h1 className="mt-3 font-serif text-5xl text-navy">Content desk</h1>
        <p className="mt-4 max-w-xl text-slate">Publish agenda, speakers, sponsors, and pages. Financial records are not available to this role.</p>
      </section>
    )
  }
  const snapshot = await loadMonitor()
  const totals = monitorTotals(snapshot.rows)
  const bySlab = new Map<string, number>()
  for (const row of snapshot.rows) bySlab.set(row.slabName || "No slab", (bySlab.get(row.slabName || "No slab") ?? 0) + 1)
  const maxSlab = Math.max(1, ...bySlab.values())
  const stats = [
    ["Registrations", String(totals.total)],
    ["Confirmed", String(totals.confirmed)],
    ["Awaiting payment", String(totals.pending)],
    ["Checked in", String(totals.checkedIn)],
    ["Verified collections", formatInrFromPaise(snapshot.collectedPaise)],
    ["Quoted on records", formatInrFromPaise(totals.quotedPaise)],
    ["Refunds", String(totals.refunds)],
    ["Clubs", String(totals.clubs)],
  ]
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Registration monitor</p>
          <h1 className="mt-3 font-serif text-5xl text-navy">Overview</h1>
        </div>
        <Link href="/admin/registrations" className="btn inline-flex">Open the register</Link>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-slate">Figures come from the registration and payment records. Pending payments are not treated as money received.</p>
      <dl className="mt-8 grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="flex min-h-32 flex-col justify-between bg-paper px-5 py-5">
            <dt className="text-[0.68rem] tracking-[0.16em] text-cranberry uppercase">{label}</dt>
            <dd className="mt-3 font-serif text-4xl text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 grid items-stretch gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div className="flex h-full min-w-0 flex-col">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-serif text-3xl text-navy">Latest registrations</h2>
            <a className="text-sm font-semibold underline decoration-gold underline-offset-4" href="/api/admin/exports/registrations">Download CSV</a>
          </div>
          <RegistrationRows rows={snapshot.rows.slice(0, 8)} />
        </div>
        <div className="flex h-full flex-col border border-line bg-paper px-5 py-5">
          <h2 className="font-serif text-3xl text-navy">By slab</h2>
          <ul className="mt-6 grid flex-1 content-start gap-5">
            {[...bySlab.entries()].map(([name, count]) => (
              <li key={name}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span>{name}</span>
                  <span className="text-slate">{count}</span>
                </div>
                <div className="mt-2 h-1.5 bg-ivory">
                  <div className="h-1.5 bg-gold" style={{ width: `${(count / maxSlab) * 100}%` }} />
                </div>
              </li>
            ))}
            {bySlab.size === 0 ? <li className="text-slate">No registrations yet.</li> : null}
          </ul>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <Link href="/admin/check-in" className="border border-line px-3 py-3 text-center font-semibold hover:border-gold">Check-in</Link>
            <Link href="/admin/payments" className="border border-line px-3 py-3 text-center font-semibold hover:border-gold">Payments</Link>
            <Link href="/admin/reports" className="border border-line px-3 py-3 text-center font-semibold hover:border-gold">Reports</Link>
            <Link href="/admin/registrations" className="border border-line px-3 py-3 text-center font-semibold hover:border-gold">All records</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
