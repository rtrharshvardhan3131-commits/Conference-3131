import type { Metadata } from "next"
import Link from "next/link"
import { AgendaBoard } from "@/components/public/agenda-board"
import { PageIntro } from "@/components/public/page-intro"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "Agenda" }

export default async function AgendaPage() {
  const site = await getCachedPublicSite()
  const dates = [site.event.startDate, site.event.endDate]
  return (
    <>
      <PageIntro eyebrow="Programme" title="Agenda" summary="Only sessions an administrator has published appear here." />
      <div className="container-summit py-12">
        <AgendaBoard dates={dates} sessions={site.sessions} />
        <Link href="/agenda/event.ics" className="btn mt-8 inline-flex">Add to calendar</Link>
      </div>
    </>
  )
}
