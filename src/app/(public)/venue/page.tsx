import type { Metadata } from "next"
import { NotifyForm } from "@/components/public/notify-form"
import { PageIntro } from "@/components/public/page-intro"
import { ComingSoon } from "@/components/ui/badge"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "Venue" }

export default async function VenuePage() {
  const site = await getCachedPublicSite()
  const published = site.venue.status === "published" && site.venue.name
  const blocks = published
    ? [
        ["Address", site.venue.address],
        ["Accommodation", site.venue.accommodation],
        ["Check-in and check-out", site.venue.checkIn],
        ["Meals", site.venue.meals],
        ["Transportation", site.venue.transport],
        ["Parking", site.venue.parking],
        ["Accessibility", site.venue.accessibility],
        ["Guidelines", site.venue.guidelines],
      ]
    : []
  return (
    <>
      <PageIntro
        eyebrow="Place"
        title={published ? site.venue.name ?? "Venue" : "Venue Announcement Coming Soon"}
        summary={published ? site.venue.address ?? undefined : `Preferred region: ${site.venue.region}. The final venue will be published after the District Rotaract Representative approves it.`}
      />
      <div className="container-summit py-16">
        {published ? (
          <dl className="max-w-3xl divide-y divide-line border-y border-line">
            {blocks.filter(([, value]) => value).map(([label, value]) => (
              <div key={String(label)} className="grid gap-2 py-6 md:grid-cols-[14rem_1fr]">
                <dt className="text-sm tracking-[0.16em] text-gold uppercase">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            {site.venue.mapUrl ? (
              <div className="py-6">
                <a className="underline decoration-gold underline-offset-4" href={site.venue.mapUrl}>Open the map</a>
              </div>
            ) : null}
          </dl>
        ) : (
          <div className="grid max-w-2xl gap-8">
            <p className="text-slate">Room assignments are never published on this page. They will be visible only to the relevant delegate and authorised administrators.</p>
            <section className="border border-line bg-paper p-5">
              <ComingSoon />
              <h2 className="mt-3 font-serif text-3xl text-navy">Map</h2>
              <p className="mt-2 text-slate">The map stays unpublished until the venue is approved.</p>
            </section>
            <section className="border border-line bg-paper p-5">
              <ComingSoon />
              <h2 className="mt-3 font-serif text-3xl text-navy">Travel from Pune</h2>
              <p className="mt-2 text-slate">To be announced. Transport options will be published with the venue.</p>
              {site.event.venueTargetNote ? <p className="mt-2 text-sm text-slate">{site.event.venueTargetNote}</p> : null}
            </section>
            <NotifyForm topic="venue" targetNote={site.event.venueTargetNote} />
          </div>
        )}
      </div>
    </>
  )
}
