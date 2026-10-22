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
      <PageIntro
        eyebrow={site.event.rotaractYear}
        title="Register"
        summary="A place is confirmed only after payment is verified on the server."
      />
      <div className="container-summit max-w-3xl py-8 md:py-16">
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
