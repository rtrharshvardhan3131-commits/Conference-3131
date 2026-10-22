import { saveVenue } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function VenueAdminPage() {
  await requirePermission("manage_content")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Venue" />
  const admin = createAdminClient()
  const { data } = await admin.from("venue_details").select("*").eq("id", 1).maybeSingle()
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Venue</h1>
      <p className="mt-3 max-w-2xl text-slate">Leave the status as pending until the District Rotaract Representative approves the venue. Publishing requires a name and address.</p>
      <form action={saveVenue} className="mt-8 grid max-w-xl gap-3">
        <select name="status" defaultValue={data?.status ?? "pending_approval"} className="border border-line px-3 py-3">
          <option value="pending_approval">Pending approval</option>
          <option value="published">Published</option>
        </select>
        {["region", "name", "address", "map_url", "accommodation", "check_in_notes", "meal_notes", "transport_notes", "parking_notes", "accessibility_notes", "guidelines"].map((field) => (
          <textarea key={field} name={field} defaultValue={data?.[field] ?? ""} placeholder={field.replaceAll("_", " ")} className="border border-line px-3 py-3" />
        ))}
        <button className="bg-navy px-5 py-3 text-ivory">Save venue</button>
      </form>
    </section>
  )
}
