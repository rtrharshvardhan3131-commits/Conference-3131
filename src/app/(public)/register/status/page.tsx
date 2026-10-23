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
      <div className="container-summit max-w-2xl py-8 md:py-16">
        <form action="/api/registration-status" method="post" className="grid gap-4 border border-line bg-paper px-5 py-6">
          <h2 className="font-serif text-3xl text-ink">Look up with Rotary ID and email</h2>
          <p className="text-sm leading-relaxed text-slate">The lookup returns only the registration that matches both fields.</p>
          <label className="grid gap-2 text-sm font-medium">
            Rotary ID
            <input name="reference" required autoComplete="off" className="w-full border border-line bg-ivory px-3 text-base" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Email used at registration
            <input name="email" type="email" required autoComplete="email" inputMode="email" className="w-full border border-line bg-ivory px-3 text-base" />
          </label>
          {notice ? <p role="alert" className="border border-red-800/30 bg-red-50 px-4 py-3 text-sm text-red-900">{notice}</p> : null}
          <button className="btn inline-flex min-h-12 justify-center">Open my registration</button>
        </form>
      </div>
    </>
  )
}
