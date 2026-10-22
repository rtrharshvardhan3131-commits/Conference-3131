import { notFound } from "next/navigation"
import { assignRoom, correctRegistration } from "@/app/actions/admin"
import { isDistrictClub, ROTARACT_CLUBS } from "@/domain/clubs"
import { participantRoleLabel } from "@/domain/participant-role"
import { TSHIRT_SIZES, isTshirtSize } from "@/domain/tshirt"
import { DISTRICT_ZONES, isDistrictZone } from "@/domain/zones"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { formatInrFromPaise } from "@/domain/money"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function RegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("view_registrations")
  const { id } = await params
  if (!isSupabaseConfigured()) return <OfflineDesk title="Registration" />

  const supabase = await createServerSupabase()
  const { data } = await supabase.from("registrations").select("*").eq("id", id).maybeSingle()
  if (!data) notFound()
  const { data: history } = await supabase.from("audit_logs").select("action, created_at, metadata").eq("entity_id", id).order("created_at", { ascending: false })
  const { data: payment } = await supabase.from("payments").select("proof_path, manual_reference, status").eq("registration_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  return (
    <section className="grid gap-10">
      <div>
        <p className="eyebrow">{data.reference}</p>
        <h1 className="mt-3 font-serif text-5xl text-navy">{data.full_name}</h1>
        <p className="mt-3 text-slate">{participantRoleLabel(data.participant_role ?? "")} · {data.status.replaceAll("_", " ")} · {data.slab_name_snapshot} · {formatInrFromPaise(data.amount_paise)}</p>
        {data.coupon_code ? <p className="mt-2">Offer · {data.coupon_code}{data.discount_paise ? ` · ${formatInrFromPaise(data.discount_paise)} off` : ""}</p> : null}
        {data.council_member ? <p className="mt-2">Council member · {data.council_position}</p> : null}
        <p className="mt-2 text-sm text-slate">The amount and payment status cannot be edited on this form.</p>
      </div>
      <div className="grid max-w-xl gap-3 border border-line p-5">
        <h2 className="font-serif text-3xl text-navy">Documents</h2>
        <p className="text-sm text-slate">These files stay with the committee. A payment screenshot does not confirm the registration.</p>
        {data.government_id_path ? (
          <a className="underline decoration-gold underline-offset-4" href={`/api/admin/registration-documents?registration=${data.id}&kind=government-id`}>Open government ID</a>
        ) : <p>No government ID on file.</p>}
        {data.photograph_path ? (
          <a className="underline decoration-gold underline-offset-4" href={`/api/admin/registration-documents?registration=${data.id}&kind=photograph`}>Open professional photograph</a>
        ) : <p>No professional photograph on file.</p>}
        {payment?.proof_path ? (
          <a className="underline decoration-gold underline-offset-4" href={`/api/admin/registration-documents?registration=${data.id}&kind=payment-proof`}>Open payment screenshot</a>
        ) : <p>No payment screenshot on file.</p>}
        {payment?.manual_reference ? <p className="text-sm text-slate">Manual reference: {payment.manual_reference}</p> : null}
      </div>
      <form action={correctRegistration} className="grid max-w-xl gap-4">
        <input type="hidden" name="id" value={data.id} />
        {[
          ["full_name", data.full_name],
          ["phone", data.phone],
          ["club", data.club],
          ["designation", data.designation],
          ["district_zone", data.district_zone],
          ["dietary_preference", data.dietary_preference],
          ["accommodation_preference", data.accommodation_preference],
          ["emergency_contact_name", data.emergency_contact_name],
          ["emergency_contact_phone", data.emergency_contact_phone],
          ["rotary_id", data.rotary_id],
        ].map(([name, value]) => (
          <label key={name} className="grid gap-2 text-sm capitalize">{name === "district_zone" ? "Zone" : name === "designation" ? "Club position" : name === "rotary_id" ? "Rotary ID" : name.replaceAll("_", " ")}
            {name === "club" ? (
              <select name="club" defaultValue={value ?? ""} className="border border-line bg-paper px-3 py-3 text-base">
                {value && !isDistrictClub(value) ? <option value={value}>{value}</option> : null}
                {ROTARACT_CLUBS.map((club) => <option key={club} value={club}>{club}</option>)}
              </select>
            ) : name === "district_zone" ? (
              <select name="district_zone" defaultValue={value ?? ""} className="border border-line bg-paper px-3 py-3 text-base">
                <option value="">Select your zone</option>
                {value && !isDistrictZone(value) ? <option value={value}>{value}</option> : null}
                {DISTRICT_ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            ) : (
              <input name={name} defaultValue={value ?? ""} className="border border-line px-3 py-3" />
            )}
          </label>
        ))}
        <label className="grid gap-2 text-sm">T-shirt size
          <select name="tshirt_size" defaultValue={data.tshirt_size ?? ""} className="border border-line bg-paper px-3 py-3 text-base">
            <option value="">Select a size</option>
            {data.tshirt_size && !isTshirtSize(data.tshirt_size) ? <option value={data.tshirt_size}>{data.tshirt_size}</option> : null}
            {TSHIRT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button className="bg-navy px-5 py-3 text-ivory">Save corrections</button>
      </form>
      <form action={assignRoom} className="grid max-w-xl gap-4 border border-line p-5">
        <h2 className="font-serif text-3xl text-navy">Room allocation</h2>
        <p className="text-sm text-slate">Leave the room blank until the committee assigns one. This is visible only to this delegate.</p>
        <input type="hidden" name="id" value={data.id} />
        <label className="grid gap-2 text-sm">Room number
          <input name="room_number" defaultValue={data.room_number ?? ""} className="border border-line px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">Sharing with
          <input name="roommate_name" defaultValue={data.roommate_name ?? ""} className="border border-line px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">Check-in note
          <input name="room_note" defaultValue={data.room_note ?? ""} className="border border-line px-3 py-3" />
        </label>
        <button className="bg-navy px-5 py-3 text-ivory">Save room</button>
      </form>
      <div>
        <h2 className="font-serif text-3xl">Audit</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(history ?? []).map((item) => <li key={item.created_at}>{item.created_at} · {item.action}</li>)}
          {(history ?? []).length === 0 ? <li className="text-slate">No audited corrections yet.</li> : null}
        </ul>
      </div>
    </section>
  )
}
