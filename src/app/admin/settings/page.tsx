import { assignRole, saveSettings } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isEmailConfigured, isPaymentConfigured, isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function SettingsPage() {
  await requirePermission("manage_settings")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Settings" />
  const admin = createAdminClient()
  const { data: settings } = await admin.from("event_settings").select("*").eq("id", 1).maybeSingle()
  const { data: operations } = await admin.from("event_operations").select("*").eq("id", 1).maybeSingle()
  return (
    <section className="grid gap-10">
      <h1 className="font-serif text-5xl text-navy">Settings</h1>
      <ul className="text-sm text-slate">
        <li>Database: {isSupabaseConfigured() ? "credentials present" : "not configured"}</li>
        <li>Razorpay: {isPaymentConfigured() && process.env.RAZORPAY_WEBHOOK_SECRET ? "key and webhook secret present, not yet certified by a test transaction" : "not fully configured"}</li>
        <li>Email: {isEmailConfigured() ? "provider key present" : "not configured"}</li>
      </ul>
      <form action={saveSettings} className="grid max-w-xl gap-3">
        <input name="event_name" defaultValue={settings?.event_name ?? ""} className="border border-line px-3 py-3" />
        <input name="subtitle" defaultValue={settings?.subtitle ?? ""} className="border border-line px-3 py-3" />
        <input name="tagline" defaultValue={settings?.tagline ?? ""} className="border border-line px-3 py-3" />
        <input name="public_email" defaultValue={settings?.public_email ?? ""} placeholder="Public email" className="border border-line px-3 py-3" />
        <input name="public_phone" defaultValue={settings?.public_phone ?? ""} placeholder="Public phone" className="border border-line px-3 py-3" />
        <input name="policy_version" defaultValue={settings?.policy_version ?? ""} className="border border-line px-3 py-3" />
        <label className="grid gap-2 text-sm">Payment review note
          <input name="payment_review_note" defaultValue={settings?.payment_review_note ?? ""} placeholder="How long finance confirmation usually takes" className="border border-line px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">Speakers target note
          <input name="speakers_target_note" defaultValue={settings?.speakers_target_note ?? ""} placeholder="Optional. Shown beside Notify me." className="border border-line px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">Sponsors target note
          <input name="sponsors_target_note" defaultValue={settings?.sponsors_target_note ?? ""} placeholder="Optional. Shown beside Notify me." className="border border-line px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">Venue target note
          <input name="venue_target_note" defaultValue={settings?.venue_target_note ?? ""} placeholder="Optional. Shown beside Notify me." className="border border-line px-3 py-3" />
        </label>
        <input name="registration_limit" defaultValue={operations?.registration_limit ?? ""} placeholder="Registration limit, blank for none" className="border border-line px-3 py-3" />
        <input name="budget_rupees" placeholder="Internal budget ceiling in rupees" className="border border-line px-3 py-3" />
        <label className="flex gap-3"><input type="checkbox" name="registration_open" defaultChecked={settings?.registration_open} /> Registration open</label>
        <label className="flex gap-3"><input type="checkbox" name="emergencyContact" defaultChecked /> Emergency contact required</label>
        <label className="flex gap-3"><input type="checkbox" name="dietary" defaultChecked /> Dietary preference required</label>
        <label className="flex gap-3"><input type="checkbox" name="accommodation" defaultChecked /> Accommodation preference required</label>
        <label className="flex gap-3"><input type="checkbox" defaultChecked disabled /> Club position required</label>
        <label className="flex gap-3"><input type="checkbox" defaultChecked disabled /> Zone required</label>
        <button className="btn">Save settings</button>
      </form>
      <form action={assignRole} className="grid max-w-xl gap-3 border-t border-line pt-8">
        <h2 className="font-serif text-3xl">Assign a role</h2>
        <p className="text-sm text-slate">The person must already have signed up. This is not a public admin registration.</p>
        <input name="email" type="email" required placeholder="Email" className="border border-line px-3 py-3" />
        <select name="role" className="border border-line px-3 py-3">
          {["super_admin", "district_admin", "finance_admin", "registration_admin", "content_editor", "delegate"].map((role) => <option key={role}>{role}</option>)}
        </select>
        <button className="border border-navy px-5 py-3">Assign role</button>
      </form>
    </section>
  )
}
