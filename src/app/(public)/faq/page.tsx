import type { Metadata } from "next"
import { FaqList } from "@/components/public/faq-list"
import { PageIntro } from "@/components/public/page-intro"
import { withReviewFaqs } from "@/domain/experience"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "FAQ" }

export default async function FaqPage() {
  const site = await getCachedPublicSite()
  return (
    <>
      <PageIntro eyebrow="Questions" title="FAQ" summary="Answers the organising committee has published for delegates." />
      <div className="container-summit max-w-3xl py-12">
        <FaqList faqs={withReviewFaqs(site.faqs)} />
      </div>
    </>
  )
}
