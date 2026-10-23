"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { primaryNav } from "@/components/public/nav"

function current(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function PrimaryLinks() {
  const pathname = usePathname()
  return (
    <>
      {primaryNav.map((item) => {
        const active = current(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={active ? "text-gold" : "text-ivory/85 hover:text-gold"}
          >
            {item.label}
          </Link>
        )
      })}
      <Link
        href="/register/status"
        aria-current={current(pathname, "/register/status") ? "page" : undefined}
        className={current(pathname, "/register/status") ? "text-gold" : "text-ivory/85 hover:text-gold"}
      >
        My registration
      </Link>
    </>
  )
}
