import Link from "next/link"
import QRCode from "qrcode"
import { formatInrFromPaise } from "@/domain/money"
import { registrationStage } from "@/domain/experience"
import { formatEventRange } from "@/lib/format"
import { getCachedPublicSite } from "@/server/content"
import { requireActor } from "@/server/session"
import { createServerSupabase } from "@/lib/supabase/server"

export const instant = false

export default async function DelegateHome() {
  const actor = await requireActor()
  const site = await getCachedPublicSite()
  let reference: string | null = null
  let status = "No registration is linked to this login yet."
  let amount = "—"
  let preference = "Not recorded"
  let name = "Welcome"
  const supabase = await createServerSupabase()
  const { data: registration } = await supabase
    .from("registrations")
    .select("reference, status, amount_paise, accommodation_preference, full_name, room_number")
    .eq("user_id", actor.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  const { data: notes } = await supabase
    .from("announcements")
    .select("id, title, body")
    .eq("status", "published")
    .in("audience", ["public", "delegates"])
  const announcements = notes ?? []
  if (registration) {
    reference = registration.reference
    status = registration.status.replaceAll("_", " ")
    amount = formatInrFromPaise(registration.amount_paise)
    preference = registration.accommodation_preference || "Not recorded"
    name = registration.full_name
  }

  const stage = registration ? registrationStage(registration.status) : "review"
  const roomValue = registration && "room_number" in registration && registration.room_number ? String(registration.room_number) : null
  let pass: string | null = null
  if (stage === "confirmed" && reference) {
    try {
      pass = await QRCode.toDataURL(reference, { margin: 1, width: 280 })
    } catch {
      pass = null
    }
  }
  const cards = [
    { href: "/delegate/registration", label: "Registration", value: reference ?? "Not linked", detail: status },
    { href: "/delegate/itinerary", label: "Itinerary", value: formatEventRange(site.event.startDate, site.event.endDate), detail: site.sessions.length === 0 ? "Conference Programme Coming Soon." : `${site.sessions.length} published sessions` },
    { href: "/delegate/room", label: "Room", value: roomValue ?? preference, detail: roomValue ? "Your assigned room." : "Room allocation has not been published." },
    { href: "/delegate/payment", label: "Payment", value: amount, detail: status },
  ]

  return (
    <section>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Your summit</p>
      <h1 className="mt-2 font-serif text-4xl text-navy md:text-5xl">{name}</h1>
      <p className="mt-3 max-w-2xl text-slate">{site.event.name} · {site.event.durationLabel}. Use the menu for your registration, itinerary, room, and payment.</p>
      <div className="mt-6 border border-line bg-paper p-5" role="status">
        <p className="text-xs tracking-[0.16em] text-gold uppercase">Status</p>
        <p className="mt-2 font-serif text-3xl text-navy">{!registration ? "No registration yet" : stage === "confirmed" ? "Confirmed" : stage === "closed" ? "Closed" : "Payment under review"}</p>
        <p className="mt-2 text-sm text-slate">{stage === "confirmed" ? "Finance has confirmed this registration." : "Payment is not confirmed until finance records it. A screenshot does not confirm the place."}</p>
        {roomValue ? <p className="mt-3 text-sm text-ink">Room {roomValue}</p> : <p className="mt-3 text-sm text-slate">Room details appear here when the committee assigns one.</p>}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/agenda" className="btn inline-flex justify-center">Agenda</Link>
          <Link href="/venue" className="inline-flex min-h-11 items-center justify-center border border-ink px-4 font-semibold">Venue</Link>
        </div>
      </div>
      {pass ? (
        <div className="mt-6 border border-line bg-paper p-5">
          <h2 className="font-serif text-3xl text-navy">Delegate pass</h2>
          <p className="mt-2 text-sm text-slate">This code shows your Rotary ID. The desk confirms it from the registration record.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pass} alt={`Check-in code for ${reference}`} width={280} height={280} className="mt-4 h-40 w-40" />
        </div>
      ) : null}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link href={card.href} className="block h-full border border-line bg-paper px-5 py-5 hover:border-gold">
              <p className="text-xs tracking-[0.16em] text-gold uppercase">{card.label}</p>
              <p className="mt-2 font-serif text-2xl text-navy">{card.value}</p>
              <p className="mt-2 text-sm text-slate">{card.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-serif text-3xl text-navy">Announcements</h2>
      <ul className="mt-4 space-y-4">
        {announcements.map((item) => (
          <li key={item.id} className="border border-line bg-paper px-5 py-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-slate">{item.body}</p>
          </li>
        ))}
        {announcements.length === 0 ? <li className="text-slate">No announcements have been published.</li> : null}
      </ul>
    </section>
  )
}
