import { Suspense } from "react"
import { DelegateShell } from "@/components/delegate/shell"
import { requireActor } from "@/server/session"

export const instant = false

async function DelegateFrame({ children }: { children: React.ReactNode }) {
  const actor = await requireActor()
  return <DelegateShell email={actor.email}>{children}</DelegateShell>
}

export default function DelegateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8">Loading your portal…</p>}>
      <DelegateFrame>{children}</DelegateFrame>
    </Suspense>
  )
}
