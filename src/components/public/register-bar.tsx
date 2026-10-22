"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function RegisterBar() {
  const pathname = usePathname()
  if (pathname.startsWith("/register")) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <Link href="/register" className="btn w-full">
        Register now
      </Link>
    </div>
  )
}
