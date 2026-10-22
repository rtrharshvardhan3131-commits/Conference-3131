import type { ReactNode } from "react"

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={["rounded-[var(--radius-card)] border border-line bg-paper p-4", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  )
}
