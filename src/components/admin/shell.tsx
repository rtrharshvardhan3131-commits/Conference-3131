import Link from "next/link"
import { Suspense } from "react"
import { signOut } from "@/app/actions/auth"
import { AdminMenu } from "@/components/admin/admin-menu"
import { AdminNav } from "@/components/admin/nav"
import { DistrictLogo } from "@/components/public/district-logo"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { isStaff, staffNavigation } from "@/domain/permissions"
import { requireActor } from "@/server/session"

function Denied() {
  return (
    <div className="mx-auto max-w-lg px-2 py-12">
      <p className="eyebrow">Committee desk</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Administrators only</h1>
      <p className="mt-4 text-slate">This registration monitor opens with a committee login. A delegate account stays in the delegate portal.</p>
      <Link href="/delegate" className="btn mt-8 inline-flex">Go to the delegate portal</Link>
    </div>
  )
}

async function AdminMenuSlot() {
  const actor = await requireActor()
  if (!isStaff(actor.roles)) return null
  const role = actor.roles[0]?.replaceAll("_", " ") ?? "staff"
  return <AdminMenu links={staffNavigation(actor.roles)} role={role} email={actor.email} />
}

async function AdminDesktopNav() {
  const actor = await requireActor()
  if (!isStaff(actor.roles)) return null
  const role = actor.roles[0]?.replaceAll("_", " ") ?? "staff"
  return (
    <aside className="hidden bg-navy text-ivory lg:block lg:min-h-screen">
      <div className="px-5 py-6">
        <Link href="/admin" aria-label="Rotaract District 3131">
          <DistrictLogo className="h-12 w-auto" />
        </Link>
        <p className="mt-4 font-serif text-xl">Committee desk</p>
      </div>
      <AdminNav links={staffNavigation(actor.roles)} />
      <div className="px-5 py-6">
        <p className="text-xs tracking-[0.14em] text-gold uppercase">{role}</p>
        <p className="mt-1 truncate text-sm text-ivory/70">{actor.email}</p>
        <form action={signOut} className="mt-4">
          <button className="text-sm text-ivory/70 underline decoration-gold/60 underline-offset-4">Sign out</button>
        </form>
      </div>
    </aside>
  )
}

async function AdminBody({ children }: { children: React.ReactNode }) {
  const actor = await requireActor()
  if (!isStaff(actor.roles)) return <Denied />
  return children
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[18rem_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy px-4 py-3 text-ivory lg:hidden">
        <Link href="/" className="min-w-0" aria-label="Rotaract District 3131">
          <DistrictLogo className="h-9 w-auto max-w-full" />
        </Link>
        <Suspense fallback={<span className="border border-ivory/40 px-3 py-2 text-sm">Menu</span>}>
          <AdminMenuSlot />
        </Suspense>
      </header>
      <Suspense fallback={<aside className="hidden bg-navy lg:block lg:min-h-screen" />}>
        <AdminDesktopNav />
      </Suspense>
      <div className="desk min-w-0 px-4 py-8 md:px-8 lg:px-10">
        <Suspense fallback={<PageSkeleton label="Opening the committee desk" />}>
          <AdminBody>{children}</AdminBody>
        </Suspense>
      </div>
    </div>
  )
}
