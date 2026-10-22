import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { RegistrationWizard } from "@/components/register/wizard"
import { PageIntro } from "@/components/public/page-intro"
import { supabaseSecretKey } from "@/lib/env"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "Register" }

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageIntro eyebrow="RIY 2026–27" title="Register" summary="Loading the open registration slab." />}>
      <RegisterBody />
    </Suspense>
  )
}

async function RegisterBody() {
  await connection()
  const site = await getCachedPublicSite()
  return (
    <>
      <section className="border-b border-ivory/10 bg-navy px-4 py-4 text-ivory lg:hidden">
        <p className="text-xs tracking-[0.18em] text-gold uppercase">{site.event.rotaractYear}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Register</h1>
      </section>
      <div className="hidden lg:block">
        <PageIntro
          eyebrow={site.event.rotaractYear}
          title="Register"
          summary="A place is confirmed only after payment is verified on the server."
        />
      </div>
      <div className="container-summit min-w-0 max-w-3xl py-5 lg:py-16">
        <RegistrationWizard
          slabs={site.slabs}
          registrationOpen={site.event.registrationOpen}
          requirements={site.event.fieldRequirements}
          databaseReady={Boolean(supabaseSecretKey()) && !site.unavailable}
          serverNow={new Date().toISOString()}
          policyVersion={site.event.policyVersion}
          paymentReviewNote={site.event.paymentReviewNote}
        />
      </div>
    </>
  )
}
