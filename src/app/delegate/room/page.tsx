import { createServerSupabase } from "@/lib/supabase/server"
import { getCachedPublicSite } from "@/server/content"
import { requireActor } from "@/server/session"

export const instant = false

export default async function DelegateRoomPage() {
  const actor = await requireActor()
  const site = await getCachedPublicSite()
  let preference = "Not recorded"
  let room = "Not assigned"
  let roommate = "Not assigned"
  let note = ""
  if (actor.id) {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from("registrations")
      .select("accommodation_preference, room_number, roommate_name, room_note")
      .eq("user_id", actor.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      const fallback = await supabase
        .from("registrations")
        .select("accommodation_preference")
        .eq("user_id", actor.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      preference = fallback.data?.accommodation_preference || preference
    } else {
      preference = data?.accommodation_preference || preference
      room = data?.room_number || room
      roommate = data?.roommate_name || roommate
      note = data?.room_note || ""
    }
  }

  const rows = [
    ["Your preference", preference],
    ["Room", room],
    ["Sharing with", roommate],
    ["Venue", site.venue.status === "published" && site.venue.name ? site.venue.name : "Venue Announcement Coming Soon"],
  ]

  return (
    <section>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Stay</p>
      <h1 className="mt-2 font-serif text-4xl text-navy md:text-5xl">Room allocation</h1>
      <p className="mt-3 max-w-2xl text-slate">A room number is shown here only after the committee assigns it. Your preference is not an allocation.</p>
      <dl className="mt-8 max-w-2xl divide-y divide-line border-y border-line">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 md:grid-cols-[12rem_1fr]">
            <dt className="text-slate">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="mt-6 max-w-2xl text-sm text-slate">{note}</p> : null}
      {site.venue.accommodation ? <p className="mt-6 max-w-2xl text-sm text-slate">{site.venue.accommodation}</p> : null}
    </section>
  )
}
