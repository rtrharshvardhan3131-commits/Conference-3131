import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function AuditPage() {
  await requirePermission("view_audit")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Audit log" />
  const supabase = await createServerSupabase()
  const { data } = await supabase.from("audit_logs").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(100)
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Audit log</h1>
      <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
        {(data ?? []).map((row) => <li key={row.id} className="py-3">{row.created_at} · {row.action} · {row.entity_type} · {row.entity_id}</li>)}
        {(data ?? []).length === 0 ? <li className="py-3 text-slate">No privileged actions have been recorded.</li> : null}
      </ul>
    </section>
  )
}
