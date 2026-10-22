import Link from "next/link"
import { DistrictLogo } from "@/components/public/district-logo"
import { MobileNav } from "@/components/public/mobile-nav"
import { primaryNav } from "@/components/public/nav"

export function SiteHeader({
  account,
}: {
  account: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-50 w-full max-w-full bg-navy text-ivory">
      <div className="relative flex w-full min-w-0 items-center gap-2 border-b border-ivory/10 px-4 py-2 lg:hidden">
        <Link href="/" className="min-w-0 flex-1" aria-label="Rotaract District 3131">
          <DistrictLogo priority className="h-10 w-auto max-w-full" />
        </Link>
        <Link href="/register" className="btn inline-flex min-h-11 shrink-0 px-3 py-2 text-sm">
          Register
        </Link>
        <MobileNav />
      </div>

      <div className="hidden border-b border-ivory/10 lg:block">
        <div className="container-summit flex items-center justify-between gap-4 py-3">
          <Link href="/" className="shrink-0" aria-label="Rotaract District 3131">
            <DistrictLogo priority className="h-12 w-auto" />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-ivory/85" aria-label="Primary">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-gold">
                {item.label}
              </Link>
            ))}
            <Link href="/register/status" className="hover:text-gold">
              My registration
            </Link>
            <span className="text-ivory">{account}</span>
            <Link href="/register" className="btn inline-flex min-h-11 px-4 py-2 text-sm">
              Register Now
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
