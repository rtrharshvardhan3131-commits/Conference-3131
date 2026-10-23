import { saveCoupon } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { formatInrFromPaise } from "@/domain/money"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function OffersPage() {
  await requirePermission("manage_slabs")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Offers" />
  const admin = createAdminClient()
  const { data } = await admin.from("coupons").select("id, code, name, kind, percent, value_paise, quantity_limit, quantity_used, status").order("created_at", { ascending: false })
  return (
    <section className="grid gap-10">
      <h1 className="font-serif text-5xl text-navy">Offers</h1>
      <p className="max-w-2xl text-slate">A published code can be entered on the registration slab step. It reduces that registration’s fee. An offer applies only when a fee still remains to transfer.</p>
      <ul className="divide-y divide-line border-y border-line">
        {(data ?? []).length === 0 ? <li className="py-4 text-slate">No offers yet.</li> : null}
        {(data ?? []).map((coupon) => (
          <li key={coupon.id} className="py-4">
            {coupon.code} · {coupon.name} · {coupon.kind === "percent" ? `${coupon.percent}%` : formatInrFromPaise(coupon.value_paise ?? 0)} · {coupon.quantity_used}{coupon.quantity_limit === null ? "" : ` / ${coupon.quantity_limit}`} used · {coupon.status}
          </li>
        ))}
      </ul>
      <form action={saveCoupon} className="grid max-w-xl gap-4">
        <h2 className="font-serif text-3xl">Add or replace an offer</h2>
        <input name="id" placeholder="Existing offer ID, optional" className="border border-line px-3 py-3" />
        <input name="code" required minLength={3} maxLength={32} placeholder="Code, such as SUMMIT10" className="border border-line px-3 py-3" autoCapitalize="characters" />
        <input name="name" required minLength={2} placeholder="Offer name shown to the delegate" className="border border-line px-3 py-3" />
        <select name="kind" className="border border-line px-3 py-3" defaultValue="percent">
          <option value="percent">Percent off the open fee</option>
          <option value="amount">Fixed rupees off the open fee</option>
        </select>
        <input name="value" required type="number" min="1" step="1" placeholder="Percent, or rupees" className="border border-line px-3 py-3" />
        <input name="starts_at" type="datetime-local" className="border border-line px-3 py-3" />
        <input name="ends_at" type="datetime-local" className="border border-line px-3 py-3" />
        <input name="quantity_limit" type="number" min="0" placeholder="How many registrations can use it, optional" className="border border-line px-3 py-3" />
        <select name="status" className="border border-line px-3 py-3" defaultValue="draft">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button className="btn">Save offer</button>
      </form>
    </section>
  )
}
