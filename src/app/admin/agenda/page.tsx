import { deleteSession, saveSession } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { overlappingSessionIds } from "@/domain/sessions"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function AgendaAdminPage() {
  await requirePermission("manage_content")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Agenda" />
  const admin = createAdminClient()
  const { data } = await admin.from("agenda_sessions").select("id, title, session_date, starts_at, ends_at, location, status").order("session_date").order("sort_order")
  const overlaps = new Set(overlappingSessionIds((data ?? []).map((session) => ({
    id: session.id,
    sessionDate: session.session_date,
    startsAt: String(session.starts_at).slice(0, 5),
    endsAt: String(session.ends_at).slice(0, 5),
    location: session.location,
  }))))
  return (
    <section className="grid gap-8">
      <h1 className="font-serif text-5xl text-navy">Agenda</h1>
      <ul className="divide-y divide-line border-y border-line">
        {(data ?? []).map((session) => (
          <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <span>{session.session_date} {String(session.starts_at).slice(0, 5)} {session.title} · {session.status}{overlaps.has(session.id) ? " · overlap" : ""}</span>
            <form action={deleteSession}><input type="hidden" name="id" value={session.id} /><button className="text-sm underline">Delete</button></form>
          </li>
        ))}
      </ul>
      <form action={saveSession} className="grid max-w-xl gap-3">
        <input name="title" required placeholder="Session title" className="border border-line px-3 py-3" />
        <textarea name="description" placeholder="Description" className="border border-line px-3 py-3" />
        <input name="session_date" type="date" required defaultValue="2027-02-13" className="border border-line px-3 py-3" />
        <input name="starts_at" type="time" required className="border border-line px-3 py-3" />
        <input name="ends_at" type="time" required className="border border-line px-3 py-3" />
        <input name="location" placeholder="Room" className="border border-line px-3 py-3" />
        <input name="category" placeholder="Category" className="border border-line px-3 py-3" />
        <input name="speaker_id" placeholder="Speaker ID, optional" className="border border-line px-3 py-3" />
        <input name="sort_order" type="number" defaultValue={1} className="border border-line px-3 py-3" />
        <select name="status" className="border border-line px-3 py-3"><option value="draft">Draft</option><option value="published">Published</option></select>
        <button className="btn">Save session</button>
      </form>
    </section>
  )
}
