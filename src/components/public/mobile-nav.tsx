"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"

const items = [
  { href: "/agenda", label: "Agenda" },
  { href: "/speakers", label: "Speakers" },
  { href: "/venue", label: "Venue" },
  { href: "/faq", label: "FAQ" },
  { href: "/register", label: "Register" },
] as const

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previous = document.activeElement
    const focusable = panel?.querySelectorAll<HTMLElement>("a, button")
    focusable?.[0]?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
        return
      }
      if (event.key !== "Tab" || !panel) return
      const nodes = [...panel.querySelectorAll<HTMLElement>("a, button")]
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex min-h-11 items-center justify-center border border-ivory/40 px-3 text-sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <nav ref={panelRef} id={panelId} className="absolute inset-x-0 top-full z-50 border-t border-ivory/10 bg-navy px-4 py-2 shadow-2xl" aria-label="Mobile">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="block min-h-11 border-b border-ivory/10 py-3 text-lg text-ivory" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  )
}
