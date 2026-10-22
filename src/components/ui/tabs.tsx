"use client"

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"

export type TabItem = {
  id: string
  label: string
  panel: ReactNode
}

export function Tabs({ tabs, label }: { tabs: readonly TabItem[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "")
  const baseId = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function select(index: number) {
    const next = tabs[index]
    if (!next) return
    setActive(next.id)
    refs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === active)
    if (index < 0) return
    if (event.key === "ArrowRight") {
      event.preventDefault()
      select((index + 1) % tabs.length)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      select((index - 1 + tabs.length) % tabs.length)
    } else if (event.key === "Home") {
      event.preventDefault()
      select(0)
    } else if (event.key === "End") {
      event.preventDefault()
      select(tabs.length - 1)
    }
  }

  if (tabs.length === 0) return null

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-2 overflow-x-auto">
        {tabs.map((tab, index) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[index] = node
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`min-h-[var(--spacing-tap)] shrink-0 border px-4 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cranberry ${selected ? "border-cranberry bg-cranberry text-white" : "border-line bg-paper text-ink"}`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-4 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cranberry"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  )
}
