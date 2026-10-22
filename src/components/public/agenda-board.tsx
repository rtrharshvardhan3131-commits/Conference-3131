"use client"

import { useState } from "react"
import type { PublicSession } from "@/domain/public-site"
import { formatLongDate } from "@/lib/format"

export function AgendaBoard({ dates, sessions }: { dates: string[]; sessions: PublicSession[] }) {
  const [active, setActive] = useState(dates[0] ?? "")
  const day = sessions.filter((session) => session.sessionDate === active)

  return (
    <div>
      <div className="flex gap-3" role="tablist" aria-label="Conference days">
        {dates.map((date, index) => (
          <button
            key={date}
            type="button"
            role="tab"
            aria-selected={active === date}
            className={`min-h-11 border px-4 text-base font-semibold ${active === date ? "border-navy bg-navy text-ivory" : "border-line bg-paper text-ink"}`}
            onClick={() => setActive(date)}
          >
            Day {index + 1}
          </button>
        ))}
      </div>
      <h2 className="mt-8 font-serif text-4xl">{formatLongDate(active)}</h2>
      {day.length === 0 ? (
        <p className="mt-6 max-w-xl font-serif text-3xl text-slate">Coming Soon</p>
      ) : (
        <ol className="mt-8 border-l border-line pl-4">
          {day.map((session) => (
            <li key={session.id} className="relative grid gap-3 border-b border-line py-6 md:grid-cols-[9rem_1fr]">
              <p className="text-gold">{session.startsAt}–{session.endsAt}</p>
              <div>
                <p className="text-sm tracking-[0.16em] text-slate uppercase">{session.category}</p>
                <h3 className="mt-1 font-serif text-3xl">{session.title}</h3>
                {session.description ? <p className="mt-3 text-slate">{session.description}</p> : null}
                <p className="mt-3 text-sm">{[session.speakerName, session.location].filter(Boolean).join(" · ")}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
