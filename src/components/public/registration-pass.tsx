import Image from "next/image"
import Link from "next/link"
import QRCode from "qrcode"
import { formatInrFromPaise } from "@/domain/money"

export async function RegistrationPass({
  reference,
  name,
  club,
  slab,
  amountPaise,
  status,
  paid,
}: {
  reference: string
  name: string
  club: string
  slab: string
  amountPaise: number
  status: string
  paid: boolean
}) {
  const amount = formatInrFromPaise(amountPaise)
  const qr = await QRCode.toDataURL(reference, { margin: 1, width: 280 })
  const message = [
    "The SOVEREIGN Summit",
    "13–14 February 2027",
    `Rotary ID: ${reference}`,
    name,
    club,
    `${slab} · ${amount}`,
    status,
    "Keep this message. The desk checks the Rotary ID on the server.",
  ].join("\n")
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div className="grid gap-8">
      <dl className="divide-y divide-line border-y border-line">
        {[
          ["Rotary ID", reference],
          ["Name", name],
          ["Club", club],
          ["Slab", slab],
          ["Amount", amount],
          ["Status", status],
        ].map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm tracking-[0.14em] text-gold uppercase">{label}</dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 sm:grid-cols-[280px_1fr] sm:items-center">
        <Image src={qr} alt={`QR code for registration ${reference}`} width={280} height={280} unoptimized className="w-full max-w-[280px] bg-white p-2" />
        <div>
          <p className="text-sm text-slate">
            {paid
              ? "Show this code at the desk. It carries the reference only. The desk confirms payment on the server."
              : "This code is not valid for entry until the payment is confirmed on the server."}
          </p>
          <div className="mt-4 grid gap-3">
            <a className="btn inline-flex min-h-12 justify-center" href={whatsapp} target="_blank" rel="noreferrer">Send confirmation on WhatsApp</a>
            <a className="inline-flex min-h-12 items-center justify-center border border-navy px-4 font-semibold" href="/api/calendar">Add the dates to your calendar</a>
            <Link className="inline-flex min-h-12 items-center justify-center border border-line px-4" href="/register/status">Open this registration later</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
