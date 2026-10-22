import { connection } from "next/server"
import { CountdownClock } from "@/components/public/countdown-clock"
import { nextSlabDeadline, type DeadlineSlab } from "@/domain/experience"

export async function LiveCountdown({
  slabs,
  startDate,
  endDate,
  timeZone,
  onDark = false,
}: {
  slabs: readonly DeadlineSlab[]
  startDate: string
  endDate: string
  timeZone: string
  onDark?: boolean
}) {
  await connection()
  // Request time, after connection(), so the first numbers match the server render.
  // eslint-disable-next-line react-hooks/purity
  const serverNow = Date.now()
  const deadline = nextSlabDeadline(slabs, serverNow)
  const target = deadline?.target ?? new Date(`${startDate}T00:00:00+05:30`).getTime()
  const label = deadline ? `${deadline.name} ${deadline.kind === "ends" ? "ends" : "opens"}` : "The Summit opens"
  return (
    <CountdownClock
      target={target}
      label={label}
      startDate={startDate}
      endDate={endDate}
      timeZone={timeZone}
      serverNow={serverNow}
      onDark={onDark}
    />
  )
}
