import { updateEnquiry } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function EnquiriesPage() {
  await requirePermission("review_enquiries")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Enquiries" />
  const supabase = await createServerSupabase()
  const { data } = await supabase.from("support_enquiries").select("id, kind, name, email, subject, message, status, created_at").order("created_at", { ascending: false }).limit(50)
  return (
    <section className="grid gap-6">
      <h1 className="font-serif text-5xl text-navy">Enquiries</h1>
      {(data ?? []).map((enquiry) => (
        <article key={enquiry.id} className="border border-line bg-paper p-5">
          <p className="text-sm text-gold">{enquiry.kind} · {enquiry.status}</p>
          <h2 className="mt-2 font-serif text-2xl">{enquiry.subject}</h2>
          <p className="text-sm text-slate">{enquiry.name} · {enquiry.email}</p>
          <p className="mt-3">{enquiry.message}</p>
          <form action={updateEnquiry} className="mt-4 flex gap-3">
            <input type="hidden" name="id" value={enquiry.id} />
            <select name="status" defaultValue={enquiry.status} className="border border-line px-3 py-2">
              {["open", "in_progress", "resolved", "closed"].map((status) => <option key={status}>{status}</option>)}
            </select>
            <button className="border border-navy px-3 py-2">Update</button>
          </form>
        </article>
      ))}
    </section>
  )
}
