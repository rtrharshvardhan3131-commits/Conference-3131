import { sendCampaign } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function CommunicationsPage() {
  await requirePermission("send_communications")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Communications" />
  const supabase = await createServerSupabase()
  const { count } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "confirmed")
  const { data: campaigns } = await supabase.from("notification_campaigns").select("title, recipient_count, sent_count, failed_count, created_at").order("created_at", { ascending: false }).limit(10)
  return (
    <section className="grid gap-8">
      <h1 className="font-serif text-5xl text-navy">Communications</h1>
      <p>Confirmed delegates who would receive this message: {count ?? 0}.</p>
      <form action={sendCampaign} className="grid max-w-xl gap-3">
        <input type="hidden" name="audience" value="confirmed" />
        <input name="title" required placeholder="Subject" className="border border-line px-3 py-3" />
        <textarea name="body" required placeholder="Message" className="border border-line px-3 py-3" />
        <label className="flex gap-3"><input type="checkbox" name="confirm" /> I confirm sending to {count ?? 0} confirmed delegates.</label>
        <button className="bg-navy px-5 py-3 text-ivory">Send</button>
      </form>
      <ul className="text-sm">{(campaigns ?? []).map((campaign) => <li key={campaign.created_at}>{campaign.title}: {campaign.sent_count} sent, {campaign.failed_count} not sent, of {campaign.recipient_count}</li>)}</ul>
    </section>
  )
}
