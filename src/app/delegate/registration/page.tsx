import Image from "next/image"
import QRCode from "qrcode"
import { submitDelegateSupport } from "@/app/actions/delegate"
import { formatInrFromPaise } from "@/domain/money"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireActor } from "@/server/session"

export const instant = false

export default async function DelegateRegistrationPage() {
  const actor = await requireActor()
  const supabase = await createServerSupabase()
  const { data } = await supabase.from("registrations").select("id, reference, full_name, status, slab_name_snapshot, amount_paise, club, checked_in_at").eq("user_id", actor.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (!data) return <p>No registration is linked to this account.</p>
  const qr = data.status === "confirmed" ? await QRCode.toDataURL(data.reference, { margin: 1, width: 280 }) : null
  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_16rem]">
      <div>
        <h1 className="font-serif text-5xl text-navy">{data.reference}</h1>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {[
            ["Name", data.full_name],
            ["Club", data.club],
            ["Slab", data.slab_name_snapshot],
            ["Amount", formatInrFromPaise(data.amount_paise)],
            ["Status", data.status.replaceAll("_", " ")],
            ["Checked in", data.checked_in_at ? "Yes" : "Not yet"],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 md:grid-cols-[10rem_1fr]"><dt className="text-slate">{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        <form id="support" action={submitDelegateSupport} className="mt-8 grid max-w-xl gap-3">
          <input type="hidden" name="registration_id" value={data.id} />
          <label className="grid gap-2">Support request<textarea name="message" required minLength={10} className="border border-line px-3 py-3" /></label>
          <button className="btn">Send to the committee</button>
        </form>
      </div>
      {qr ? (
        <div>
          <Image src={qr} alt={`QR code for registration ${data.reference}`} width={280} height={280} unoptimized />
          <p className="mt-2 text-sm text-slate">Show this reference at check-in. The code is not proof of payment by itself.</p>
        </div>
      ) : null}
    </section>
  )
}
