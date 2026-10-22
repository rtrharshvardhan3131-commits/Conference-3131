import { getCachedPublicSite } from "@/server/content"

function nextDayStamp(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  const lengths = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let nextDay = day + 1
  let nextMonth = month
  let nextYear = year
  if (nextDay > lengths[month - 1]) {
    nextDay = 1
    nextMonth += 1
  }
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  return `${nextYear}${String(nextMonth).padStart(2, "0")}${String(nextDay).padStart(2, "0")}`
}

export async function GET() {
  const site = await getCachedPublicSite()
  const start = site.event.startDate.replaceAll("-", "")
  const end = nextDayStamp(site.event.endDate)
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The SOVEREIGN Summit//EN",
    "BEGIN:VEVENT",
    "UID:sovereign-summit-2027@district3131",
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    "SUMMARY:The SOVEREIGN Summit",
    "DESCRIPTION:District Conference of Rotaract District 3131. Two days and one night.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=sovereign-summit.ics",
    },
  })
}
