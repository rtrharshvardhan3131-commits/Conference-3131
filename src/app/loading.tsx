import { DistrictLogo } from "@/components/public/district-logo"
import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <div className="min-h-full bg-ivory">
      <header className="bg-navy px-4 py-3 text-ivory">
        <DistrictLogo className="h-9 w-auto" />
      </header>
      <main className="container-summit py-10">
        <PageSkeleton label="The SOVEREIGN Summit" />
      </main>
    </div>
  )
}
