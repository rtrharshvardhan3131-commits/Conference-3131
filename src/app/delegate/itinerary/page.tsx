import { formatLongDate } from "@/lib/format"
import { getCachedPublicSite } from "@/server/content"
import { requireActor } from "@/server/session"

export const instant = false

export default async function DelegateItineraryPage() {
  await requireActor()
  const site = await getCachedPublicSite()
  const days = [site.event.startDate, site.event.endDate]

  return (
    <section>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Programme</p>
      <h1 className="mt-2 font-serif text-4xl text-navy md:text-5xl">Itinerary</h1>
      <p className="mt-3 max-w-2xl text-slate">Only sessions an administrator has published appear here. Nothing is added to fill the days.</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {days.map((date, index) => {
          const sessions = site.sessions.filter((session) => session.sessionDate === date)
          return (
            <article key={date} className="flex h-full flex-col border border-line bg-paper px-5 py-5">
              <p className="text-xs tracking-[0.16em] text-gold uppercase">Day {index + 1}</p>
              <h2 className="mt-2 font-serif text-3xl text-navy">{formatLongDate(date)}</h2>
              {sessions.length === 0 ? (
                <p className="mt-4 text-sm text-slate">Conference Programme Coming Soon.</p>
              ) : (
                <ol className="mt-4 divide-y divide-line">
                  {sessions.map((session) => (
                    <li key={session.id} className="py-3">
                      <p className="text-sm text-gold">{session.startsAt}–{session.endsAt}</p>
                      <p className="font-semibold">{session.title}</p>
                      {session.location ? <p className="text-sm text-slate">{session.location}</p> : null}
                      {session.speakerName ? <p className="text-sm text-slate">{session.speakerName}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
