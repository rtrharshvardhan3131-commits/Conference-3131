import { eventCalendar } from "@/domain/experience"
import { getCachedPublicSite } from "@/server/content"

export async function GET() {
  const site = await getCachedPublicSite()
  const body = eventCalendar({
    name: site.event.name,
    startDate: site.event.startDate,
    endDate: site.event.endDate,
    description: "Rotaract District 3131 district conference. Venue to be announced.",
    stamp: "20261014T000000Z",
  })
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sovereign-summit.ics"',
    },
  })
}
