import Link from "next/link"
import { Suspense } from "react"
import { connection } from "next/server"
import { ActiveSlab } from "@/components/public/active-slab"
import { LiveCountdown } from "@/components/public/countdown"
import { NotifyForm } from "@/components/public/notify-form"
import { SummitGateway } from "@/components/public/summit-gateway"
import { showPriceOnHome, showSocialProof, whatsAppShareUrl } from "@/domain/experience"
import type { PublicSlab } from "@/domain/public-site"
import { activeSlabs } from "@/domain/slabs"
import { formatInrFromPaise } from "@/domain/money"
import { appUrl } from "@/lib/env"
import { formatEventRange, paragraphs } from "@/lib/format"
import { getCachedPublicSite } from "@/server/content"
import { loadSocialProof } from "@/server/social-proof"

export default async function HomePage() {
  const site = await getCachedPublicSite()
  const lead = paragraphs(site.pages.home_intro?.body ?? "")[0]
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

      <section id="programme" className="bg-paper py-12 text-ink">
        <div className="container-summit">
          <p className="eyebrow">Still to be published</p>
          <h2 className="section-title mt-3">Agenda, speakers, and venue</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate">
            {site.speakers.length === 0 && site.sessions.length === 0 && site.venue.status !== "published"
              ? "Names, timings, and the venue address stay off this site until the district approves them."
              : "Published details are linked below. Anything still awaiting approval stays on its own page."}
          </p>
          <ul className="mt-6 grid gap-px bg-line sm:grid-cols-2">
            <li className="bg-ivory px-5 py-5">
              <Link href="/agenda" className="font-semibold text-ink">Agenda</Link>
              <p className="mt-1 text-sm text-slate">{site.sessions.length === 0 ? "Coming Soon" : `${site.sessions.length} published sessions`}</p>
            </li>
            <li className="bg-ivory px-5 py-5">
              <Link href="/speakers" className="font-semibold text-ink">Speakers</Link>
              <p className="mt-1 text-sm text-slate">{site.speakers.length === 0 ? "Coming Soon" : site.speakers.map((speaker) => speaker.name).join(", ")}</p>
            </li>
            <li className="bg-ivory px-5 py-5">
              <Link href="/venue" className="font-semibold text-ink">Venue</Link>
              <p className="mt-1 text-sm text-slate">{venueName}</p>
            </li>
            <li className="bg-ivory px-5 py-5">
              <Link href="/about" className="font-semibold text-ink">Recognition</Link>
              <p className="mt-1 text-sm text-slate">Coming Soon. No award is listed until the district publishes it.</p>
            </li>
          </ul>
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
