import Link from "next/link"
import { signOut } from "@/app/actions/auth"
import { AdminNav } from "@/components/admin/nav"
import { DistrictLogo } from "@/components/public/district-logo"
import { isStaff, staffNavigation } from "@/domain/permissions"
import { requireActor } from "@/server/session"

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const actor = await requireActor()
  if (!isStaff(actor.roles)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <p className="eyebrow">Committee desk</p>
        <h1 className="mt-3 font-serif text-4xl text-navy">Administrators only</h1>
        <p className="mt-4 text-slate">This registration monitor opens with a committee login. A delegate account stays in the delegate portal.</p>
        <Link href="/delegate" className="btn mt-8 inline-flex">Go to the delegate portal</Link>
      </div>
    )
  }
  const links = staffNavigation(actor.roles)
  const role = actor.roles[0]?.replaceAll("_", " ") ?? "staff"
  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[18rem_1fr]">
      <aside className="bg-navy text-ivory lg:min-h-screen">
        <div className="flex items-center justify-between gap-4 px-5 py-6">
          <div>
            <Link href="/admin" aria-label="Rotaract District 3131">
              <DistrictLogo className="h-12 w-auto" />
            </Link>
          </div>
          <details className="lg:hidden">
            <summary className="menu-summary cursor-pointer border border-ivory/30 px-3 py-2 text-sm">Menu</summary>
            <div className="absolute inset-x-0 z-40 mt-3 border-y border-ivory/10 bg-navy py-4">
              <AdminNav links={links} />
            </div>
          </details>
        </div>
        <div className="hidden lg:block">
          <AdminNav links={links} />
        </div>
        <div className="px-5 py-6">
          <p className="text-xs tracking-[0.14em] text-gold uppercase">{role}</p>
          <p className="mt-1 truncate text-sm text-ivory/70">{actor.email}</p>
          <form action={signOut} className="mt-4">
            <button className="text-sm text-ivory/70 underline decoration-gold/60 underline-offset-4">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-8 md:px-8 lg:px-10">{children}</div>
    </div>
  )
}
