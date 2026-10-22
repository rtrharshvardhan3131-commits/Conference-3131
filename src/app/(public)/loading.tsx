import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container-summit grid gap-4 py-16" aria-busy="true" aria-live="polite">
      <p className="text-base text-ink">Loading the Summit…</p>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
