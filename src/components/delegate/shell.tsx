"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/app/actions/auth"
import { DistrictLogo } from "@/components/public/district-logo"
import { MobileSheet } from "@/components/ui/mobile-sheet"

const links = [
  { href: "/delegate", label: "Overview" },
  { href: "/delegate/registration", label: "Registration" },
  { href: "/delegate/itinerary", label: "Itinerary" },
  { href: "/delegate/room", label: "Room" },
  { href: "/delegate/payment", label: "Payment" },
  { href: "/delegate/profile", label: "Profile" },
  { href: "/delegate/registration#support", label: "Help" },
]

function isCurrent(path: string, href: string) {
  const target = href.split("#")[0]
  if (target === "/delegate") return path === "/delegate"
  return path === target || path.startsWith(`${target}/`)
}

export function DelegateShell({ emailSlot, children }: { emailSlot?: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname()

  const nav = (
    <nav className="grid gap-1" aria-label="Delegate">
      {links.map((link) => {
        const current = !link.href.includes("#") && isCurrent(path, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`block border-l-2 px-4 py-3 text-base ${current ? "border-gold bg-ivory/10 text-ivory" : "border-transparent text-ivory/75 hover:text-ivory"}`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-navy text-ivory lg:flex">
        <div className="border-b border-ivory/10 px-5 py-6">
          <Link href="/" aria-label="Rotaract District 3131">
            <DistrictLogo className="h-12 w-auto" />
          </Link>
          <p className="mt-3 font-serif text-xl">Delegate portal</p>
          <div className="mt-2">{emailSlot}</div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">{nav}</div>
        <div className="grid gap-3 border-t border-ivory/10 px-5 py-5 text-sm">
          <Link href="/" className="text-ivory/75 hover:text-gold">Public website</Link>
          <form action={signOut}>
            <button className="text-left text-ivory/75 hover:text-gold">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy px-4 py-3 text-ivory lg:hidden">
          <Link href="/delegate" className="min-w-0" aria-label="Rotaract District 3131">
            <DistrictLogo className="h-9 w-auto max-w-full" />
          </Link>
          <MobileSheet label="Menu">
            <div className="px-2 py-3">
              {nav}
              <div className="mt-3 grid gap-3 border-t border-ivory/10 px-4 pt-3 text-base">
                {emailSlot}
                <Link href="/" className="min-h-11 text-ivory/75">Public website</Link>
                <form action={signOut}>
                  <button className="min-h-11 text-left text-ivory/75">Sign out</button>
                </form>
              </div>
            </div>
          </MobileSheet>
        </header>
        <div className="desk px-5 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  )
}
