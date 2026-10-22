import type { ReactNode } from "react"

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="border border-line bg-paper px-4 py-8 text-center">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <p className="mt-2 text-base text-slate">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
