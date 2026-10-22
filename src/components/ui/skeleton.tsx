export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-line motion-reduce:animate-none ${className}`} />
}
