"use client"

import { useEffect, useState } from "react"

function kolkataDay(now: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now))
}

function countdownParts(now: number, target: number, startDate: string, endDate: string, timeZone: string) {
  const today = kolkataDay(now, timeZone)
  if (today > endDate) return { status: "The Summit has concluded." as const }
  if (today >= startDate && today <= endDate) return { status: "The Summit is underway." as const }
  const remaining = Math.max(0, target - now)
  return {
    parts: [
      ["days", "Days", Math.floor(remaining / 86400000)],
      ["hours", "Hours", Math.floor((remaining % 86400000) / 3600000)],
      ["minutes", "Minutes", Math.floor((remaining % 3600000) / 60000)],
      ["seconds", "Seconds", Math.floor((remaining % 60000) / 1000)],
    ] as const,
  }
}

export function CountdownClock({
  target,
  label,
  startDate,
  endDate,
  timeZone,
  serverNow,
  onDark = false,
  tone = "paper",
}: {
  target: number
  label: string
  startDate: string
  endDate: string
  timeZone: string
  serverNow: number
  onDark?: boolean
  tone?: "paper" | "rail"
}) {
  const [now, setNow] = useState(serverNow)

  useEffect(() => {
    const update = () => setNow(Date.now())
    update()
    const id = window.setInterval(update, 1000)
    const onVisible = () => {
      if (document.visibilityState === "visible") update()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  const clock = countdownParts(now, target, startDate, endDate, timeZone)
  const rail = tone === "rail" || onDark

  return (
    <div aria-live="polite">
      {"status" in clock ? (
        <p className={`text-lg font-semibold ${rail ? "text-ivory" : "text-cranberry"}`}>{clock.status}</p>
      ) : rail ? (
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.28em] text-gold uppercase">{label}</p>
          <div className="mt-3 grid grid-cols-4 border-t border-gold/40">
            {clock.parts.map(([unit, partLabel, value]) => (
              <div key={unit} className="flex min-w-0 flex-col items-center border-r border-gold/25 px-1 py-3 text-center last:border-r-0">
                <p className="font-serif text-[clamp(1.8rem,4vw,3.25rem)] leading-none font-semibold text-ivory tabular-nums">{String(value).padStart(2, "0")}</p>
                <p className="mt-2 text-[0.62rem] tracking-[0.16em] text-ivory/60 uppercase">{partLabel}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-cranberry uppercase">{label}</p>
          <div className="grid grid-cols-4 gap-2">
            {clock.parts.map(([unit, partLabel, value]) => (
              <div key={unit} className="min-w-0 border border-cranberry/15 bg-paper px-1 py-3 text-center">
                <p className="font-serif text-3xl font-semibold text-cranberry tabular-nums sm:text-4xl">{String(value).padStart(2, "0")}</p>
                <p className="mt-1 text-[0.68rem] tracking-[0.14em] text-ink/70 uppercase">{partLabel}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
