import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <p className="text-xs tracking-[0.18em] text-gold uppercase">{label}</p>
      <Skeleton className="h-12 w-2/3 bg-line" />
      <Skeleton className="h-28 w-full bg-line" />
      <Skeleton className="h-28 w-full bg-line" />
    </div>
  )
}
