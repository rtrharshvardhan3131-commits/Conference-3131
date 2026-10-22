import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { PageIntro } from "@/components/public/page-intro"

export const metadata: Metadata = { title: "My registration", robots: { index: false, follow: false } }

const notices: Record<string, string> = {
  invalid: "Enter the Rotary ID and the email used at registration.",
  missing: "No registration matched that Rotary ID and email.",
}

export default function StatusPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  return (
      <Suspense fallback={<PageIntro eyebrow="Registration" title="My registration" summary="Looking up the registration." />}>
      <StatusBody searchParams={searchParams} />
    </Suspense>
  )
}

async function StatusBody({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  await connection()
  const params = await searchParams
  const notice = params.notice ? notices[params.notice] : ""
  return (
    <>
      <PageIntro
        eyebrow="Registration"
        title="My registration"
        summary="Enter the Rotary ID and the email used on the form."
      />
      <div className="container-summit grid max-w-2xl gap-10 py-8 md:py-16">
        <h2 className="font-serif text-3xl text-navy">Look up with Rotary ID and email</h2>
        <form action="/api/registration-status" method="post" className="grid gap-4">
          <label className="grid gap-2 text-sm">
            Rotary ID
            <input name="reference" required autoComplete="off" className="min-h-12 w-full border border-line bg-white px-3 text-base" />
          </label>
          <label className="grid gap-2 text-sm">
            Email used at registration
            <input name="email" type="email" required autoComplete="email" inputMode="email" className="min-h-12 w-full border border-line bg-white px-3 text-base" />
          </label>
          {notice ? <p className="text-sm text-magenta">{notice}</p> : null}
          <button className="btn inline-flex min-h-12 justify-center">Open my registration</button>
        </form>
      </div>
    </>
  )
}
