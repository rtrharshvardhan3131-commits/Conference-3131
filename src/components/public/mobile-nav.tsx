"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { primaryNav } from "@/components/public/nav"

const more = [
  { href: "/register/status", label: "My registration" },
  { href: "/contact", label: "Contact" },
  { href: "/register", label: "Register" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms and Conditions" },
  { href: "/refunds", label: "Refund and Cancellation Policy" },
  { href: "/accessibility", label: "Accessibility" },
] as const

export function MobileNav({ account }: { account: ReactNode }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
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
      document.body.style.overflow = previousOverflow
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
        Menu
      </button>
      {open ? (
        <nav
          ref={panelRef}
          id={panelId}
          className="fixed inset-0 z-[80] flex flex-col bg-navy text-ivory"
          aria-label="Mobile"
        >
          <div className="flex items-center justify-end border-b border-ivory/10 px-4 py-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center border border-ivory/40 px-3 text-sm"
              onClick={() => {
                setOpen(false)
                buttonRef.current?.focus()
              }}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-12 items-center border-b border-ivory/10 py-3 text-lg text-ivory" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="flex min-h-12 items-center border-b border-ivory/10 py-3 text-lg text-ivory [&_a]:block [&_a]:w-full">
              {account}
            </div>
            {more.map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-12 items-center border-b border-ivory/10 py-3 text-lg text-ivory" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </>
  )
}
