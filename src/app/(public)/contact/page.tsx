import type { Metadata } from "next"
import { ContactForm } from "@/components/public/enquiry-form"
import { PageIntro } from "@/components/public/page-intro"
import { whatsAppChatUrl } from "@/domain/experience"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "Contact" }

export default async function ContactPage() {
  const site = await getCachedPublicSite()
  return (
    <>
      <PageIntro eyebrow="Write to us" title="Contact" summary="Messages are stored for the organising committee. Personal phone numbers are shown only when the committee publishes them." />
      <div className="container-summit grid items-stretch gap-8 py-12 md:py-16 lg:grid-cols-2">
        <div className="flex h-full flex-col justify-between border border-line bg-paper px-6 py-8">
          <div>
            <p className="text-xs tracking-[0.16em] text-gold uppercase">Host club</p>
            <p className="mt-2 font-serif text-3xl text-navy">Announcement coming soon.</p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {site.event.publicEmail ? (
              <div>
                <p className="text-xs tracking-[0.16em] text-gold uppercase">Public email</p>
                <a className="mt-2 inline-flex min-h-11 items-center underline" href={`mailto:${site.event.publicEmail}`}>{site.event.publicEmail}</a>
              </div>
            ) : null}
            {site.event.publicPhone ? (
              <div>
                <p className="text-xs tracking-[0.16em] text-gold uppercase">Public phone</p>
                <a className="mt-2 inline-flex min-h-11 items-center underline" href={`tel:${site.event.publicPhone}`}>{site.event.publicPhone}</a>
                {whatsAppChatUrl(site.event.publicPhone) ? (
                  <a className="btn mt-3 inline-flex" href={whatsAppChatUrl(site.event.publicPhone) ?? "#"}>WhatsApp</a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="h-full border border-line bg-paper px-6 py-8">
          <ContactForm />
        </div>
      </div>
    </>
  )
}
