import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="container-summit grid gap-4 py-16" aria-busy="true" aria-live="polite">
      <p className="text-base text-ink">Loading the Summit…</p>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </main>
  )
}
