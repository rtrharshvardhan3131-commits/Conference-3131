import Link from "next/link"
import { Suspense } from "react"
import { connection } from "next/server"
import { ActiveSlab } from "@/components/public/active-slab"
import { LiveCountdown } from "@/components/public/countdown"
import { NotifyForm } from "@/components/public/notify-form"
import { SummitGateway } from "@/components/public/summit-gateway"
import { Badge } from "@/components/ui/badge"
import { showPriceOnHome, showSocialProof, whatsAppShareUrl } from "@/domain/experience"
import type { PublicSlab } from "@/domain/public-site"
import { activeSlabs } from "@/domain/slabs"
import { formatInrFromPaise } from "@/domain/money"
import { appUrl } from "@/lib/env"
import { formatEventRange, formatLongDate, paragraphs } from "@/lib/format"
import { getCachedPublicSite } from "@/server/content"
import { loadSocialProof } from "@/server/social-proof"

export default async function HomePage() {
  const site = await getCachedPublicSite()
  const lead = paragraphs(site.pages.home_intro?.body ?? "")[0]
  const dayOne = site.sessions.filter((session) => session.sessionDate === site.event.startDate)
  const dayTwo = site.sessions.filter((session) => session.sessionDate === site.event.endDate)
  const venueName = site.venue.status === "published" && site.venue.name ? site.venue.name : "Venue Announcement Coming Soon"
  const publishedSponsors = site.sponsorTiers.filter((tier) => tier.sponsors.length > 0)
  const venueLine = site.venue.status === "published" && site.venue.name ? site.venue.name : `${site.venue.region}. Venue Coming Soon`
  const shareHref = whatsAppShareUrl(`${site.event.name}. ${site.event.tagline} ${formatEventRange(site.event.startDate, site.event.endDate)}. ${appUrl()}`)
  const showOpenPrice = showPriceOnHome(process.env.NEXT_PUBLIC_SHOW_PRICE_ON_HOME)
  const facts: { label: string; value: string }[] = [
    { label: "Dates", value: formatEventRange(site.event.startDate, site.event.endDate) },
    { label: "Format", value: site.event.durationLabel },
    { label: "District", value: site.event.districtName },
    { label: "Scale", value: `About ${site.event.planningAttendance} delegates` },
    { label: "Year", value: site.event.rotaractYear },
    { label: "Venue", value: venueName },
  ]

  return (
    <div>
      <section className="cinematic-hero relative bg-[#070b14] text-ivory">
        <div id="gateway" className="hero-balance container-summit relative z-10 py-8 lg:py-10">
          <div className="hero-copy">
          <p className="hero-kicker hero-rise text-[0.68rem] font-semibold tracking-[0.32em] text-gold uppercase">{site.event.subtitle}</p>
          <h1 className="hero-title display hero-rise mt-3 text-[clamp(4.2rem,7.2vw,8rem)] leading-[0.86] text-ivory">
            The
            <span className="block">Sovereign</span>
            <span className="block">Summit</span>
          </h1>
          <div className="hero-meta mt-6">
            <p className="hero-rise max-w-xl text-lg text-ivory/80 md:text-2xl" style={{ animationDelay: "120ms" }}>{site.event.tagline}</p>
            <p className="hero-rise mt-3 font-serif text-xl text-gold md:text-2xl" style={{ animationDelay: "180ms" }}>{formatEventRange(site.event.startDate, site.event.endDate)}</p>
            <p className="hero-rise mt-2 max-w-lg text-xs tracking-[0.16em] text-ivory/55 uppercase" style={{ animationDelay: "220ms" }}>{venueLine}</p>
            <div className="hero-rise mt-6 max-w-xl" style={{ animationDelay: "260ms" }}>
              <Suspense fallback={<CountdownFallback />}>
                <LiveCountdown startDate={site.event.startDate} endDate={site.event.endDate} timeZone={site.event.timezone} tone="rail" />
              </Suspense>
            </div>
            <div className="hero-rise mt-6 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "320ms" }}>
              <Link href="/register" className="inline-flex min-h-14 items-center justify-center bg-cranberry px-8 text-base font-semibold tracking-wide text-ivory hover:bg-cranberry-deep">Register now</Link>
              <Link href="/agenda" className="inline-flex min-h-14 items-center justify-center border border-ivory/40 px-8 text-base font-semibold text-ivory hover:border-gold hover:text-gold">View agenda</Link>
            </div>
            <a href={shareHref} className="hero-rise mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-gold" style={{ animationDelay: "360ms" }}>Share with your club</a>
          </div>
          </div>
          <div className="hero-mark-col">
            <SummitGateway />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-b from-transparent to-[#0c1424]" />
      </section>

      <section className="bg-[#0c1424] text-ivory">
        <dl className="container-summit grid grid-cols-2 lg:grid-cols-4">
            {[
              ["Dates", formatEventRange(site.event.startDate, site.event.endDate)],
              ["Format", site.event.durationLabel],
              ["Organiser", site.event.districtName],
              ["Venue", venueName],
            ].map(([label, value]) => (
              <div key={label} className="flex min-h-28 flex-col justify-center border-t border-ivory/10 px-5 py-5 lg:border-l lg:first:border-l-0">
                <dt className="text-[0.68rem] tracking-[0.2em] text-gold uppercase">{label}</dt>
                <dd className="mt-2 text-sm leading-snug text-ivory">{value}</dd>
              </div>
            ))}
        </dl>
      </section>

      <Suspense fallback={null}>
        <SocialProof />
      </Suspense>

      <section id="summit-story" className="bg-ivory text-ink">
        <div className="container-summit grid items-stretch gap-10 py-12 lg:grid-cols-2 lg:py-16">
          <div className="flex h-full flex-col justify-center">
            <p className="eyebrow">02 — The conference</p>
            <h2 className="section-title mt-3">{site.pages.home_intro?.title ?? "The Summit"}</h2>
            <div className="mt-5 space-y-4 text-[1.02rem] leading-relaxed text-slate">
              {paragraphs(site.pages.home_intro?.body ?? lead ?? "").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <dl className="grid h-full grid-cols-2 auto-rows-fr gap-px bg-line">
            {facts.map((fact) => (
              <div key={fact.label} className="flex h-full flex-col justify-center bg-paper px-5 py-5">
                <dt className="text-[0.68rem] tracking-[0.16em] text-gold uppercase">{fact.label}</dt>
                <dd className="mt-1 text-sm leading-snug text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-paper py-12">
        <div className="container-summit">
          <p className="eyebrow">Why attend</p>
          <h2 className="section-title mt-3">A weekend with the district</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {whyAttend.map((item) => (
              <li key={item.title} className="border border-line border-t-2 border-t-cranberry bg-paper p-5">
                <Badge tone="soon">Draft for review</Badge>
                <h3 className="mt-3 font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-slate">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="speakers" className="bg-cranberry-soft py-16 text-ink lg:py-24">
        <div className="container-summit">
          <p className="text-xs font-semibold tracking-[0.16em] text-cranberry uppercase">Speakers</p>
          <h2 className="display mt-3 text-4xl text-ink md:text-6xl">Voices of the district</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate">
            {site.speakers.length === 0
              ? "Coming Soon. No speaker is listed until the person, photograph, designation, and biography are approved."
              : site.speakers.map((speaker) => speaker.name).join(" · ")}
          </p>
          <Link href="/speakers" className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-cranberry">Speaker directory</Link>
          {site.speakers.length === 0 ? (
            <div className="mt-8 max-w-md border border-line bg-paper p-4 text-ink">
              <NotifyForm topic="speakers" targetNote={site.event.speakersTargetNote} />
            </div>
          ) : null}
        </div>
      </section>

      <section id="venue" className="bg-ivory py-16 text-ink lg:py-24">
        <div className="container-summit max-w-xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-cranberry uppercase">Venue</p>
          <h2 className="display mt-3 text-4xl text-ink md:text-6xl">{venueName}</h2>
          <p className="mt-5 text-base leading-relaxed text-slate">
            Preferred region: {site.venue.region}. Address, map, meals, and travel stay unpublished until approval.
          </p>
          <Link href="/venue" className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-cranberry">Venue details</Link>
          {site.venue.status !== "published" ? (
            <div className="mt-8 border border-line bg-paper p-4 text-ink">
              <NotifyForm topic="venue" targetNote={site.event.venueTargetNote} />
            </div>
          ) : null}
        </div>
      </section>

      <section id="experiences" className="bg-ivory py-16 text-ink lg:py-24">
        <div className="container-summit">
            <p className="eyebrow">Experiences</p>
            <h2 className="section-title mt-3">The path through the weekend</h2>
            {site.sessions.length === 0 ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate">
                Coming Soon. Day 1 is {formatLongDate(site.event.startDate)} and Day 2 is {formatLongDate(site.event.endDate)}. Sessions, fellowship, and the evening are published only after the district approves them.
              </p>
            ) : (
              <ul className="mt-5 space-y-2 text-sm text-slate">
                {[["Day 1", dayOne], ["Day 2", dayTwo]].map(([label, sessions]) => (
                  <li key={String(label)}>
                    <span className="font-semibold text-ink">{String(label)}. </span>
                    {(sessions as typeof site.sessions).map((session) => session.title).join(", ")}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/agenda" className="btn mt-8 inline-flex">Open the agenda</Link>
        </div>
      </section>

      <section id="awards" className="bg-paper py-16 lg:py-24">
        <div className="container-summit">
          <p className="eyebrow">Awards</p>
          <h2 className="section-title mt-3">Recognition</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate">
            Coming Soon. Recognition is part of the conference plan. No award, category, or recipient is listed until the district publishes it.
          </p>
          <Link href="/about" className="mt-8 inline-flex text-sm font-semibold text-ink underline decoration-gold underline-offset-4">About the Summit</Link>
        </div>
      </section>

      <section id="benefits" className="bg-cranberry py-16 text-ivory lg:py-24">
        <div className="container-summit grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-ivory/80 uppercase">Delegate benefits</p>
            <h2 className="display mt-3 text-4xl text-ivory md:text-6xl">What registration gathers</h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ivory/85">
              These are the published plans. Specific inclusions stay Coming Soon until they are approved.
            </p>
            <Link href="/register" className="mt-8 inline-flex min-h-11 items-center bg-ivory px-5 py-3 font-semibold text-cranberry-deep hover:bg-paper">Register Now</Link>
          </div>
          <ol className="space-y-5">
              {site.highlights.map((item, index) => (
                <li key={item.title} className="border-t border-ivory/25 pt-4">
                  <p className="text-xs tracking-[0.16em] text-ivory/75">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-semibold text-ivory">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ivory/85">{item.detail}</p>
                </li>
              ))}
          </ol>
        </div>
      </section>

      <section className="bg-ivory py-12">
        <div className="container-summit">
          <p className="eyebrow">Fees</p>
          <h2 className="section-title mt-3">Registration slabs</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate">The fee is shown on the registration form for the slab that is open. Later slab amounts stay unpublished.</p>
          <Suspense fallback={null}>
            <OpenSlabPrice slabs={site.slabs} showPrice={showOpenPrice} />
          </Suspense>
          <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
            <ul className="grid h-full auto-rows-fr divide-y divide-line border border-line">
              {site.slabs.map((slab) => (
                <li key={slab.id} className="flex flex-col justify-center bg-paper px-5 py-5">
                  <p className="font-semibold">{slab.name}</p>
                </li>
              ))}
            </ul>
            <Suspense fallback={<SlabFallback />}>
              <ActiveSlab slabs={site.slabs} registrationOpen={site.event.registrationOpen} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="bg-paper py-12">
        <div className="container-summit">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Questions</p>
              <h2 className="section-title mt-3">Before you register</h2>
            </div>
            <Link href="/faq" className="text-sm font-semibold text-ink underline decoration-gold underline-offset-4">All questions</Link>
          </div>
          <dl className="mt-8 grid gap-px bg-line md:grid-cols-2">
            {site.faqs.slice(0, 5).map((faq, index, list) => (
              <div key={faq.id} className={`bg-ivory px-5 py-5 ${index === list.length - 1 && list.length % 2 === 1 ? "md:col-span-2" : ""}`}>
                <dt className="font-semibold text-ink">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line bg-ivory py-12">
        <div className="container-summit">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">For partners</p>
              <h2 className="section-title mt-3">Partnership categories</h2>
            </div>
            <Link href="/sponsors" className="btn inline-flex">Partner with the Summit</Link>
          </div>
          <ul className="mt-6 grid gap-px bg-line sm:grid-cols-2">
            {site.sponsorTiers.map((tier, index) => (
              <li key={tier.id} className={`bg-paper px-5 py-5 ${index === site.sponsorTiers.length - 1 && site.sponsorTiers.length % 2 === 1 ? "sm:col-span-2" : ""}`}>
                <p className="font-semibold text-ink">{tier.name}</p>
                <p className="mt-1 text-sm text-slate">
                  {tier.sponsors.length > 0 ? tier.sponsors.map((sponsor) => sponsor.name).join(", ") : "Open. No partner is named yet."}
                </p>
              </li>
            ))}
          </ul>
          {publishedSponsors.length === 0 ? (
            <div className="mt-4 max-w-md">
              <p className="text-sm text-slate">No partnership is claimed until the organising committee approves the name.</p>
              <NotifyForm topic="sponsors" targetNote={site.event.sponsorsTargetNote} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

const whyAttend = [
  { title: "Learn with the district", detail: "Draft for review. Session titles stay unpublished until they are approved." },
  { title: "Meet clubs from every zone", detail: "Draft for review. Fellowship plans stay unpublished until they are approved." },
  { title: "A residential weekend", detail: "Draft for review. Stay and meals stay unpublished until the venue is approved." },
  { title: "Recognition", detail: "Draft for review. Awards stay unpublished until the district names them." },
]

async function SocialProof() {
  const proof = await loadSocialProof()
  if (!proof || !showSocialProof(proof.delegates)) return null
  return (
    <p className="bg-ivory px-5 py-4 text-center text-sm text-ink">
      {proof.delegates} delegates registered · {proof.clubs} clubs
    </p>
  )
}

async function OpenSlabPrice({ slabs, showPrice }: { slabs: PublicSlab[]; showPrice: boolean }) {
  if (!showPrice) return null
  await connection()
  // eslint-disable-next-line react-hooks/purity
  const open = activeSlabs(
    slabs.map((slab) => ({ ...slab, status: "published" as const })),
    new Date(),
  )[0]
  if (!open) return null
  return <p className="mt-3 text-sm text-ink">Open now: {open.name} · {formatInrFromPaise(open.pricePaise)}</p>
}

function CountdownFallback() {
  return (
    <div aria-hidden="true">
      <p className="text-[0.68rem] font-semibold tracking-[0.28em] text-gold uppercase">The Summit begins</p>
      <div className="mt-3 grid grid-cols-4 border-t border-gold/40">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div key={label} className="flex min-w-0 flex-col items-center border-r border-gold/25 px-1 py-3 text-center last:border-r-0">
            <p className="font-serif text-[clamp(1.8rem,4vw,3.25rem)] leading-none font-semibold text-ivory">--</p>
            <p className="mt-2 text-[0.62rem] tracking-[0.16em] text-ivory/60 uppercase">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlabFallback() {
  return <div className="panel h-full min-h-48 min-w-0 px-6 py-8 md:px-8" aria-hidden="true" />
}
