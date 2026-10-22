import { Suspense } from "react"
import { LoginForm } from "@/app/(public)/login/login-form"
import { PageIntro } from "@/components/public/page-intro"

async function LoginNotice({ searchParams }: { searchParams: Promise<{ notice?: string; sent?: string }> }) {
  const params = await searchParams
  if (params.sent === "1") {
    return <p className="container-summit mt-8 max-w-xl border border-line bg-paper px-4 py-3 text-sm">If that email can sign in, a link is on its way.</p>
  }
  if (params.notice !== "rejected") return null
  return <p className="container-summit mt-8 max-w-xl border border-red-800/30 bg-red-50 px-4 py-3 text-sm text-red-900">The email or password was not accepted.</p>
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string; sent?: string }> }) {
  return (
    <>
      <PageIntro eyebrow="Delegates and committee" title="Sign in" summary="Use the email on your registration. Committee access is assigned in Supabase. It cannot be chosen on this form." />
      <Suspense>
        <LoginNotice searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </>
  )
}
