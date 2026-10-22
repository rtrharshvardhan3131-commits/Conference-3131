import { PageIntro } from "@/components/public/page-intro"
import { paragraphs } from "@/lib/format"
import { getCachedPublicSite } from "@/server/content"

export async function DocumentPage({ slug }: { slug: string }) {
  const site = await getCachedPublicSite()
  const page = site.pages[slug]
  if (!page) {
    return (
      <>
        <PageIntro eyebrow={site.event.districtName} title="Not published yet" summary="This page will appear when an administrator publishes it." />
      </>
    )
  }
  return (
    <>
      <PageIntro eyebrow={site.event.districtName} title={page.title} summary={page.summary} />
      <article className="container-summit prose-summit max-w-3xl py-16 text-lg">
        {paragraphs(page.body).map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </article>
    </>
  )
}
