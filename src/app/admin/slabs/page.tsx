import { saveSlab } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { formatInrFromPaise } from "@/domain/money"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function SlabsPage() {
  await requirePermission("manage_slabs")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Slabs" />
  const admin = createAdminClient()
  const { data } = await admin.from("registration_slabs").select("*").order("sort_order")
  return (
    <section className="grid gap-10">
      <h1 className="font-serif text-5xl text-navy">Registration slabs</h1>
      <p className="max-w-2xl text-slate">Changing a price does not rewrite the amount already stored on a registration.</p>
      <ul className="divide-y divide-line border-y border-line">
        {(data ?? []).map((slab) => (
          <li key={slab.id} className="py-4">{slab.name} · {formatInrFromPaise(slab.price_paise)} · {slab.status}</li>
        ))}
      </ul>
      <form action={saveSlab} className="grid max-w-xl gap-4">
        <h2 className="font-serif text-3xl">Add or replace by leaving ID blank to add</h2>
        <input name="id" placeholder="Existing slab ID, optional" className="border border-line px-3 py-3" />
        <input name="name" required placeholder="Name" className="border border-line px-3 py-3" />
        <input name="price_rupees" required type="number" min="1" step="1" placeholder="Price in rupees" className="border border-line px-3 py-3" />
        <textarea name="description" placeholder="Description" className="border border-line px-3 py-3" />
        <textarea name="benefits" placeholder="One benefit per line" className="border border-line px-3 py-3" />
        <input name="starts_at" type="datetime-local" required className="border border-line px-3 py-3" />
        <input name="ends_at" type="datetime-local" required className="border border-line px-3 py-3" />
        <input name="quantity_limit" type="number" min="0" placeholder="Quantity limit, optional" className="border border-line px-3 py-3" />
        <input name="sort_order" type="number" defaultValue={1} className="border border-line px-3 py-3" />
        <select name="status" className="border border-line px-3 py-3"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
        <button className="btn">Save slab</button>
      </form>
    </section>
  )
}
