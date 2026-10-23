import { connection } from "next/server"
import { CountdownClock } from "@/components/public/countdown-clock"

export async function LiveCountdown({
  startDate,
  endDate,
  timeZone,
  tone = "paper",
}: {
  startDate: string
  endDate: string
  timeZone: string
  tone?: "paper" | "rail"
}) {
  await connection()
  // Request time, after connection(), so the first numbers match the server render.
  // Midnight at the start of the conference day in Asia/Kolkata. Fee deadlines are not this clock.
  // eslint-disable-next-line react-hooks/purity
  const serverNow = Date.now()
  const target = new Date(`${startDate}T00:00:00+05:30`).getTime()
  return (
    <CountdownClock
      target={target}
      label="The Summit begins"
      startDate={startDate}
      endDate={endDate}
      timeZone={timeZone}
      serverNow={serverNow}
      tone={tone}
    />
  )
}
