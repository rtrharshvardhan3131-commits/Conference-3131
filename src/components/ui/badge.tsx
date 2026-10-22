import type { ReactNode } from "react"

type BadgeTone = "neutral" | "soon" | "cranberry"

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-ivory text-ink",
  soon: "border-line bg-paper text-ink",
  cranberry: "border-transparent bg-cranberry text-white",
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center border px-2 py-1 text-xs font-semibold tracking-[0.14em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function ComingSoon() {
  return <Badge tone="soon">Coming Soon</Badge>
}
