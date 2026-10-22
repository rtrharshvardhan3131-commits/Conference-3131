import { CheckInDesk } from "@/components/admin/check-in-desk"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { createServerSupabase } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/env"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ reference?: string; notice?: string }> }) {
  await requirePermission("check_in")
  const params = await searchParams
  if (!isSupabaseConfigured()) return <OfflineDesk title="Check-in" />
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from("registrations")
    .select("reference, full_name, club, status, checked_in_at")
    .order("full_name")
    .limit(500)
  const rows = data ?? []
  return (
    <section className="max-w-xl">
      <h1 className="font-serif text-5xl text-navy">Check-in</h1>
      <p className="mt-3 text-slate">Scan the QR or type the reference. The code carries the reference only. Payment is checked on the server. Confirmed registrations can be checked in once. Any other status needs a written exception.</p>
      <CheckInDesk rows={rows} reference={params.reference ?? ""} notice={params.notice ?? ""} />
    </section>
  )
}
