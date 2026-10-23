import { saveAnnouncement } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function AnnouncementsPage() {
  await requirePermission("manage_content")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Announcements" />
  const admin = createAdminClient()
  const { data } = await admin.from("announcements").select("id, title, status, audience").order("created_at", { ascending: false })
  return (
    <section className="grid gap-8">
      <h1 className="font-serif text-5xl text-navy">Announcements</h1>
      <ul>{(data ?? []).map((item) => <li key={item.id}>{item.title} · {item.audience} · {item.status}</li>)}</ul>
      <form action={saveAnnouncement} className="grid max-w-xl gap-3">
        <input name="title" required placeholder="Title" className="border border-line px-3 py-3" />
        <textarea name="body" required placeholder="Announcement" className="border border-line px-3 py-3" />
        <select name="audience" className="border border-line px-3 py-3"><option value="public">Public</option><option value="delegates">Delegates</option><option value="staff">Staff</option></select>
        <select name="status" className="border border-line px-3 py-3"><option value="draft">Draft</option><option value="published">Published</option></select>
        <button className="btn">Save announcement</button>
      </form>
    </section>
  )
}
