"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/app/actions/auth"
import { DistrictLogo } from "@/components/public/district-logo"

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

export function DelegateShell({ email, children }: { email: string; children: React.ReactNode }) {
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
          <p className="mt-2 break-all text-xs text-ivory/60">{email}</p>
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
        <details className="group sticky top-0 z-30 border-b border-ivory/10 bg-navy text-ivory lg:hidden">
          <summary className="menu-summary flex min-h-12 cursor-pointer items-center justify-between px-4 py-3">
            <DistrictLogo className="h-9 w-auto" />
            <span className="border border-ivory/40 px-3 py-2 text-sm">
              <span className="group-open:hidden">Menu</span>
              <span className="hidden group-open:inline">Close</span>
            </span>
          </summary>
          <div className="border-t border-ivory/10 px-2 py-3">
            {nav}
            <div className="mt-3 grid gap-3 border-t border-ivory/10 px-4 pt-3 text-base">
              <Link href="/" className="text-ivory/75">Public website</Link>
              <form action={signOut}><button className="min-h-11 text-left text-ivory/75">Sign out {email}</button></form>
            </div>
          </div>
        </details>
        <div className="px-5 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  )
}
