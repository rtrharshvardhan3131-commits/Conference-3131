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
}: {
  target: number
  label: string
  startDate: string
  endDate: string
  timeZone: string
  serverNow: number
  onDark?: boolean
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

  const muted = onDark ? "text-ivory/60" : "text-slate"
  const strong = onDark ? "text-ivory" : "text-ink"
  const clock = countdownParts(now, target, startDate, endDate, timeZone)

  return (
    <div aria-live="polite">
      {"status" in clock ? (
        <p className={`text-lg ${strong}`}>{clock.status}</p>
      ) : (
        <div>
          <p className={`mb-2 text-xs tracking-[0.16em] uppercase ${muted}`}>{label}</p>
          <div className="grid grid-cols-4 gap-2">
          {clock.parts.map(([unit, label, value]) => (
            <div key={unit} className="min-w-0">
              <p className={`font-serif text-3xl font-semibold tabular-nums sm:text-4xl ${strong}`}>{String(value).padStart(2, "0")}</p>
              <p className={`mt-1 text-[0.68rem] tracking-[0.14em] uppercase ${muted}`}>{label}</p>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  )
}
