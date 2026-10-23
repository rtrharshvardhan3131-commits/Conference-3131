"use client"

import type { ReactNode } from "react"

export function Toast({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] z-50 flex items-center justify-between gap-3 border border-line bg-paper p-4 text-base text-ink shadow-sm lg:bottom-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <p>{children}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex min-h-[var(--spacing-tap)] min-w-[var(--spacing-tap)] items-center justify-center px-3 text-base font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cranberry"
      >
        Dismiss
      </button>
    </div>
  )
}
