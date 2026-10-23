import { saveSponsor } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function SponsorsAdminPage() {
  await requirePermission("manage_content")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Sponsors" />
  const admin = createAdminClient()
  const { data: tiers } = await admin.from("sponsor_tiers").select("id, name").order("sort_order")
  const { data: sponsors } = await admin.from("sponsors").select("id, name, status")
  return (
    <section className="grid gap-8">
      <h1 className="font-serif text-5xl text-navy">Sponsors</h1>
      <ul>{(sponsors ?? []).map((sponsor) => <li key={sponsor.id}>{sponsor.name} · {sponsor.status}</li>)}</ul>
      <form action={saveSponsor} className="grid max-w-xl gap-3">
        <select name="tier_id" className="border border-line px-3 py-3">{(tiers ?? []).map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select>
        <input name="name" required placeholder="Sponsor name" className="border border-line px-3 py-3" />
        <textarea name="description" placeholder="Description" className="border border-line px-3 py-3" />
        <input name="website" placeholder="https://" className="border border-line px-3 py-3" />
        <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" />
        <select name="status" className="border border-line px-3 py-3"><option value="draft">Draft</option><option value="published">Published</option></select>
        <button className="btn">Save sponsor</button>
      </form>
    </section>
  )
}
