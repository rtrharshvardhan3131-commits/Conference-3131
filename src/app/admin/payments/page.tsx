import { approveManualPayment } from "@/app/actions/admin"
import { formatInrFromPaise } from "@/domain/money"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function PaymentsPage() {
  const actor = await requirePermission("view_payments")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Payments" />
  const supabase = await createServerSupabase()
  const { data } = await supabase.from("payments").select("id, registration_id, provider, amount_paise, status, created_at, proof_path").order("created_at", { ascending: false }).limit(100)
  const registrationIds = [...new Set((data ?? []).map((payment) => payment.registration_id))]
  const { data: people } = registrationIds.length === 0
    ? { data: [] }
    : await supabase.from("registrations").select("id, reference, full_name").in("id", registrationIds)
  const delegates = new Map((people ?? []).map((person) => [person.id, person]))
  const finance = actor.roles.includes("super_admin") || actor.roles.includes("finance_admin")
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-5xl text-navy">Payments</h1>
        {finance ? <a className="border border-navy px-4 py-2 text-sm" href="/api/admin/exports/payments">Download CSV</a> : null}
      </div>
      <p className="mt-3 max-w-2xl text-slate">Open the screenshot, then verify. The registration is confirmed only after this check.</p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-slate"><tr><th className="py-3">Delegate</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead>
          <tbody>
            {(data ?? []).map((payment) => {
              const delegate = delegates.get(payment.registration_id)
              const verified = payment.status === "captured"
              return (
                <tr key={payment.id} className="border-b border-line align-top">
                  <td className="py-3">
                    <span className="font-semibold">{delegate?.full_name ?? "Delegate"}</span>
                    <span className="mt-1 block text-slate">{delegate?.reference ?? "—"}</span>
                  </td>
                  <td>{formatInrFromPaise(payment.amount_paise)}</td>
                  <td>{verified ? "Verified" : payment.status.replaceAll("_", " ")}</td>
                  <td>
                    {payment.proof_path ? (
                      <a className="inline-flex min-h-11 items-center underline decoration-gold underline-offset-4" href={`/api/admin/registration-documents?registration=${payment.registration_id}&kind=payment-proof`} target="_blank" rel="noopener noreferrer">View screenshot</a>
                    ) : <span className="text-slate">No screenshot</span>}
                    {finance && payment.provider === "manual" && !verified ? (
                      <form action={approveManualPayment} className="mt-3">
                        <input type="hidden" name="payment_id" value={payment.id} />
                        <button className="min-h-11 border border-navy px-4 py-2 font-semibold">Verify</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
