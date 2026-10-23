import { Suspense } from "react"
import { DelegateShell } from "@/components/delegate/shell"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { requireActor } from "@/server/session"

export const instant = false

async function DelegateEmail() {
  const actor = await requireActor()
  return <p className="break-all text-xs text-ivory/60">{actor.email}</p>
}

export default function DelegateLayout({ children }: { children: React.ReactNode }) {
  return (
    <DelegateShell
      emailSlot={
        <Suspense fallback={null}>
          <DelegateEmail />
        </Suspense>
      }
    >
      <Suspense fallback={<PageSkeleton label="Opening your portal" />}>
        {children}
      </Suspense>
    </DelegateShell>
  )
}
