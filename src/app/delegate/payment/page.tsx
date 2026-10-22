import { formatInrFromPaise } from "@/domain/money"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireActor } from "@/server/session"

export const instant = false

export default async function DelegatePaymentPage() {
  const actor = await requireActor()
  const supabase = await createServerSupabase()
  const { data: registration } = await supabase.from("registrations").select("id, reference, amount_paise, status").eq("user_id", actor.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (!registration) return <p>No payment record is linked to this account.</p>
  const { data: payments } = await supabase.from("payments").select("provider, amount_paise, status, reconciliation_status, provider_payment_id, created_at").eq("registration_id", registration.id).order("created_at", { ascending: false })
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Payment</h1>
      <p className="mt-3 text-slate">{registration.reference} · {formatInrFromPaise(registration.amount_paise)} · {registration.status.replaceAll("_", " ")}</p>
      {registration.status === "payment_failed" ? (
        <p className="mt-4 max-w-xl text-slate">
          Finance has not confirmed this payment. The record does not store a separate rejection note, and a replacement screenshot cannot be uploaded from this page yet.
          {/* TODO: one-tap re-upload needs a delegate action that replaces the payment screenshot without marking the registration paid. */}
          {" "}Write through the contact form and include your reference {registration.reference}.
        </p>
      ) : (
        <p className="mt-4 max-w-xl text-slate">A screenshot does not confirm the registration. This page changes only after finance records the review.</p>
      )}
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {(payments ?? []).map((payment) => (
          <li key={payment.created_at} className="py-4">
            {payment.provider} · {formatInrFromPaise(payment.amount_paise)} · {payment.status.replaceAll("_", " ")} · {payment.reconciliation_status.replaceAll("_", " ")}
            {payment.provider_payment_id ? <span className="block text-sm text-slate">Provider reference {payment.provider_payment_id}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
