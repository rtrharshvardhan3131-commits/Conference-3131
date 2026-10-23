import { updateDelegateProfile } from "@/app/actions/delegate"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireActor } from "@/server/session"

export const instant = false

export default async function DelegateProfilePage() {
  const actor = await requireActor()
  const supabase = await createServerSupabase()
  const { data } = await supabase.from("profiles").select("full_name, phone, emergency_contact_name, emergency_contact_phone, dietary_preference").eq("id", actor.id).maybeSingle()
  const { data: registration } = await supabase.from("registrations").select("accommodation_preference").eq("user_id", actor.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Profile</h1>
      <p className="mt-3 text-slate">You can update contact details. Paid amounts and payment status stay with the finance record.</p>
      <form action={updateDelegateProfile} className="mt-8 grid max-w-xl gap-4">
        <p>{data?.full_name || actor.email}</p>
        <label className="grid gap-2">Mobile<input name="phone" defaultValue={data?.phone ?? ""} className="border border-line px-3 py-3" /></label>
        <label className="grid gap-2">Emergency contact<input name="emergency_contact_name" defaultValue={data?.emergency_contact_name ?? ""} className="border border-line px-3 py-3" /></label>
        <label className="grid gap-2">Emergency number<input name="emergency_contact_phone" defaultValue={data?.emergency_contact_phone ?? ""} className="border border-line px-3 py-3" /></label>
        <label className="grid gap-2">Dietary preference<input name="dietary_preference" defaultValue={data?.dietary_preference ?? ""} className="border border-line px-3 py-3" /></label>
        <label className="grid gap-2">Accommodation preference<input name="accommodation_preference" defaultValue={registration?.accommodation_preference ?? ""} className="border border-line px-3 py-3" /></label>
        <button className="btn">Save profile</button>
      </form>
    </section>
  )
}
