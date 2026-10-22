"use client"

import { useId, useState, type ReactNode } from "react"

export type AccordionItem = {
  id: string
  title: string
  body: ReactNode
}

export function Accordion({ items, label = "Sections" }: { items: readonly AccordionItem[]; label?: string }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const baseId = useId()

  return (
    <div role="group" aria-label={label} className="border-y border-line">
      {items.map((item) => {
        const expanded = openId === item.id
        const panelId = `${baseId}-${item.id}`
        return (
          <div key={item.id} className="border-b border-line last:border-b-0">
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenId(expanded ? null : item.id)}
                className="flex min-h-[var(--spacing-tap)] w-full items-center justify-between gap-4 px-1 text-left text-base font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cranberry"
              >
                {item.title}
                <span aria-hidden="true" className="text-slate">
                  {expanded ? "–" : "+"}
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-label={item.title} hidden={!expanded} className="px-1 pb-4 text-base text-ink">
              {item.body}
            </div>
          </div>
        )
      })}
    </div>
  )
}
