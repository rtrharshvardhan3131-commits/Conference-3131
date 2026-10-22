import { RegistrationRows } from "@/components/admin/registration-table"
import { filterMonitor, loadMonitor } from "@/server/registration-monitor"
import { requirePermission } from "@/server/session"

export const instant = false

const statuses = ["pending_payment", "confirmed", "payment_failed", "cancelled", "refund_pending", "refunded"]

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requirePermission("view_registrations")
  const params = await searchParams
  const query = (params.q ?? "").replace(/[%_,]/g, "").trim()
  const snapshot = await loadMonitor()
  const rows = filterMonitor(snapshot.rows, query, params.status ?? "")
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Registration monitor</p>
          <h1 className="mt-3 font-serif text-5xl text-navy">Registrations</h1>
        </div>
        <a className="btn inline-flex" href="/api/admin/exports/registrations">Download CSV</a>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-slate">{rows.length} of {snapshot.rows.length} records. Amounts here are the fee stored on each registration.</p>
      <form className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_16rem_auto]" method="get">
        <input name="q" defaultValue={params.q} placeholder="Name, email, phone, or Rotary ID" className="min-h-12 w-full border border-line bg-paper px-3 text-base" aria-label="Search registrations" />
        <select name="status" defaultValue={params.status ?? ""} className="min-h-12 w-full border border-line bg-paper px-3 text-base" aria-label="Status">
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
          ))}
        </select>
        <button className="btn min-h-12">Filter</button>
      </form>
      <div className="mt-6">
        <RegistrationRows rows={rows} />
      </div>
    </section>
  )
}
