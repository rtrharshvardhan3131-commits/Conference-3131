"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdminNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname()
  const groups = [
    { label: "Monitor", hrefs: ["/admin", "/admin/registrations", "/admin/check-in", "/admin/payments", "/admin/reports"] },
    { label: "Programme", hrefs: ["/admin/agenda", "/admin/speakers", "/admin/sponsors", "/admin/venue", "/admin/announcements", "/admin/content"] },
    { label: "Desk", hrefs: ["/admin/slabs", "/admin/offers", "/admin/communications", "/admin/enquiries", "/admin/audit-logs", "/admin/settings"] },
  ]
  return (
    <div className="grid gap-6">
      {groups.map((group) => {
        const items = links.filter((link) => group.hrefs.includes(link.href))
        if (items.length === 0) return null
        return (
          <div key={group.label}>
            <p className="px-5 text-[0.68rem] tracking-[0.18em] text-gold uppercase">{group.label}</p>
            <ul className="mt-2">
              {items.map((link) => {
                const active = link.href === "/admin" ? pathname === "/admin" : pathname === link.href || pathname.startsWith(`${link.href}/`)
                return (
                  <li key={link.href}>
                    <Link href={link.href} className={`block border-l-2 px-5 py-2.5 text-sm ${active ? "border-gold bg-white/5 text-gold" : "border-transparent text-ivory/75 hover:text-ivory"}`}>
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
