import { Suspense } from "react"
import Link from "next/link"
import { AccountLink } from "@/components/public/account-link"
import { RegisterBar } from "@/components/public/register-bar"
import { SiteFooter } from "@/components/public/site-footer"
import { SiteHeader } from "@/components/public/site-header"
import { getCachedPublicSite } from "@/server/content"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getCachedPublicSite()
  return (
    <div className="flex min-h-full flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-ivory focus:px-4 focus:py-2">
        Skip to content
      </a>
      <SiteHeader
        account={
          <Suspense fallback={<Link href="/login">Delegate Login</Link>}>
            <AccountLink />
          </Suspense>
        }
      />
      {site.unavailable ? (
        <p className="border-b border-ivory/10 bg-[#10192b] px-5 py-3 text-center text-sm text-ivory" role="status">
          We&apos;ll be back shortly. The live conference record could not be loaded, so this page is showing the approved starting copy. Registration cannot be saved until the connection returns.
        </p>
      ) : !site.configured ? (
        <p className="border-b border-ivory/10 bg-[#10192b] px-5 py-2 text-center text-sm text-ivory/80">
          Database not connected. This website is showing the approved initial conference information. Registration and administration need Supabase.
        </p>
      ) : null}
      <main id="content" className="flex-1 pb-24 lg:pb-0">
        {children}
      </main>
      <RegisterBar />
      <SiteFooter site={site} />
    </div>
  )
}
