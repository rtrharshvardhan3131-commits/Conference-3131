"use client"

import { signOut } from "@/app/actions/auth"
import { AdminNav } from "@/components/admin/nav"
import { MobileSheet } from "@/components/ui/mobile-sheet"

export function AdminMenu({
  links,
  role,
  email,
}: {
  links: { href: string; label: string }[]
  role: string
  email: string
}) {
  return (
    <MobileSheet label="Menu">
      <div className="py-4">
        <AdminNav links={links} />
      </div>
      <div className="border-t border-ivory/10 px-5 py-4">
        <p className="text-xs tracking-[0.14em] text-gold uppercase">{role}</p>
        <p className="mt-1 break-all text-sm text-ivory/70">{email}</p>
        <form action={signOut} className="mt-4">
          <button className="min-h-11 text-sm text-ivory/80 underline decoration-gold/60 underline-offset-4">Sign out</button>
        </form>
      </div>
    </MobileSheet>
  )
}
