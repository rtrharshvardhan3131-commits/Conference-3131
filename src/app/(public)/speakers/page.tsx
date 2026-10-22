import type { Metadata } from "next"
import Image from "next/image"
import { NotifyForm } from "@/components/public/notify-form"
import { PageIntro } from "@/components/public/page-intro"
import { ComingSoon } from "@/components/ui/badge"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "Speakers" }

export default async function SpeakersPage() {
  const site = await getCachedPublicSite()
  return (
    <>
      <PageIntro eyebrow="Directory" title="Speakers" summary="Profiles are published only after the name, designation, biography, and photograph are approved." />
      <div className="container-summit py-16">
        {site.speakers.length === 0 ? (
          <div className="max-w-xl">
            <ComingSoon />
            <p className="mt-4 font-serif text-4xl text-navy">Speaker announcements are coming soon.</p>
            {site.event.speakersTargetNote ? <p className="mt-3 text-slate">{site.event.speakersTargetNote}</p> : null}
            <NotifyForm topic="speakers" targetNote={site.event.speakersTargetNote} />
          </div>
        ) : (
          <ul className="grid gap-12">
            {site.speakers.map((speaker) => (
              <li key={speaker.id} className="grid gap-8 border-t border-line pt-8 md:grid-cols-[16rem_1fr]">
                {speaker.photoUrl ? (
                  <Image src={speaker.photoUrl} alt={speaker.name} width={640} height={800} sizes="(max-width: 768px) 100vw, 16rem" className="h-80 w-full object-cover" />
                ) : null}
                <div>
                  <h2 className="font-serif text-4xl text-navy">{speaker.name}</h2>
                  <p className="mt-2 text-slate">{speaker.designation}{speaker.organization ? `, ${speaker.organization}` : ""}</p>
                  <p className="mt-5 max-w-2xl">{speaker.biography}</p>
                  {speaker.sessionTitle ? <p className="mt-4 text-sm text-gold">{speaker.sessionTitle}</p> : null}
                  {speaker.links.length > 0 ? (
                    <ul className="mt-4 flex gap-4">
                      {speaker.links.map((link) => (
                        <li key={link.url}><a className="underline decoration-gold underline-offset-4" href={link.url}>{link.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
