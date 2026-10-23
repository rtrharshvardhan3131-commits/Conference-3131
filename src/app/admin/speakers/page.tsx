import { saveSpeaker } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function SpeakersAdminPage() {
  await requirePermission("manage_content")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Speakers" />
  const admin = createAdminClient()
  const { data } = await admin.from("speakers").select("id, name, status").order("sort_order")
  return (
    <section className="grid gap-8">
      <h1 className="font-serif text-5xl text-navy">Speakers</h1>
      <p className="text-slate">A profile can be published only with a name, designation, biography, and photograph.</p>
      <ul>{(data ?? []).map((speaker) => <li key={speaker.id}>{speaker.name} · {speaker.status}</li>)}</ul>
      <form action={saveSpeaker} className="grid max-w-xl gap-3">
        <input name="name" required placeholder="Name" className="border border-line px-3 py-3" />
        <input name="designation" placeholder="Designation" className="border border-line px-3 py-3" />
        <input name="organization" placeholder="Organisation" className="border border-line px-3 py-3" />
        <textarea name="biography" placeholder="Biography" className="border border-line px-3 py-3" />
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
        <select name="status" className="border border-line px-3 py-3"><option value="draft">Draft</option><option value="published">Published</option></select>
        <button className="btn">Save speaker</button>
      </form>
    </section>
  )
}
