import type { Metadata } from "next"
import Image from "next/image"
import { SponsorshipForm } from "@/components/public/enquiry-form"
import { NotifyForm } from "@/components/public/notify-form"
import { ComingSoon } from "@/components/ui/badge"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "Sponsors" }

export default async function SponsorsPage() {
  const site = await getCachedPublicSite()
  const published = site.sponsorTiers.filter((tier) => tier.sponsors.length > 0)
  return (
    <>
      <section className="relative min-h-[52vh] bg-ink text-ivory">
        <Image
          src="/images/hotel.jpg"
          alt="A premium hotel terrace at dusk, used to suggest the residential conference. This is not the confirmed venue."
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/25" />
        <div className="container-summit relative flex min-h-[52vh] flex-col justify-end py-14">
          <p className="text-xs tracking-[0.28em] text-gold uppercase">Partnerships</p>
          <h1 className="display mt-4 max-w-3xl text-5xl md:text-7xl">Stand with the Summit</h1>
          <p className="mt-4 max-w-xl text-ivory/80">A conversation with the organising committee. Nothing is published, and no tier is reserved, until a partnership is approved.</p>
        </div>
      </section>
      <div className="container-summit py-16">
        {published.length === 0 ? (
          <div className="max-w-xl">
            <ComingSoon />
            <p className="mt-4 font-serif text-4xl text-ink">Approved partners will be named here.</p>
            <NotifyForm topic="sponsors" targetNote={site.event.sponsorsTargetNote} />
          </div>
        ) : (
          published.map((tier) => (
            <section key={tier.id} className="mb-14">
              <h2 className="text-sm tracking-[0.2em] text-gold uppercase">{tier.name}</h2>
              <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {tier.sponsors.map((sponsor) => (
                  <li key={sponsor.id} className="border border-line bg-paper p-6">
                    {sponsor.logoUrl ? <Image src={sponsor.logoUrl} alt={sponsor.name} width={240} height={120} sizes="240px" className="h-16 w-auto object-contain" /> : null}
                    <h3 className="mt-4 font-serif text-3xl text-navy">{sponsor.name}</h3>
                    {sponsor.description ? <p className="mt-3 text-slate">{sponsor.description}</p> : null}
                    {sponsor.website ? <a className="mt-4 inline-block underline decoration-gold" href={sponsor.website}>{sponsor.website}</a> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        <section className="mt-16 max-w-xl border-t border-line pt-12">
          <h2 className="font-serif text-4xl text-ink">Sponsorship enquiry</h2>
          <p className="mt-3 text-slate">Tell the committee about your organisation. This does not reserve a tier.</p>
          <div className="mt-8">
            <SponsorshipForm />
          </div>
        </section>
      </div>
    </>
  )
}
