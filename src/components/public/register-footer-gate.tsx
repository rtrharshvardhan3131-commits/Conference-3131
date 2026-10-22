"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

export function RegisterFooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/register") return <div className="hidden lg:contents">{children}</div>
  return children
}
