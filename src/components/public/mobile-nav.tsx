"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
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

function pathOf(href: string) {
  const path = href.split("#")[0]?.split("?")[0] || "/"
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path
}

export function MobileNav({ account }: { account: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const ignoreOpen = useRef(false)
  const menuEntry = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    function onPop() {
      if (!menuEntry.current) return
      menuEntry.current = false
      setOpen(false)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    if (!open) return
    const pathAtOpen = window.location.pathname
    const scrollY = window.scrollY
    const body = document.body
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      closeMenu(false)
      buttonRef.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      body.style.width = previous.width
      if (window.location.pathname === pathAtOpen) window.scrollTo(0, scrollY)
    }
  }, [open])

  function closeMenu(fromPop: boolean) {
    ignoreOpen.current = true
    setOpen(false)
    window.setTimeout(() => {
      ignoreOpen.current = false
    }, 700)
    if (!fromPop && menuEntry.current) {
      menuEntry.current = false
      window.history.back()
      return
    }
    menuEntry.current = false
  }

  function openMenu() {
    if (ignoreOpen.current || open) return
    setOpen(true)
    if (!menuEntry.current) {
      window.history.pushState({ sovereignMenu: true }, "")
      menuEntry.current = true
    }
  }

  function onMenuClickCapture(event: MouseEvent<HTMLElement>) {
    const anchor = (event.target as Element | null)?.closest("a")
    if (!anchor) return
    const href = anchor.getAttribute("href")
    if (!href) return
    const internal = href.startsWith("/")
    if (!internal) {
      menuEntry.current = false
      ignoreOpen.current = true
      setOpen(false)
      window.setTimeout(() => {
        ignoreOpen.current = false
      }, 700)
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (pathOf(href) === pathname) {
      closeMenu(false)
      return
    }
    menuEntry.current = false
    ignoreOpen.current = true
    setOpen(false)
    window.setTimeout(() => {
      ignoreOpen.current = false
    }, 700)
    router.replace(href)
  }

  function itemClass(href: string) {
    const current = pathOf(href) === pathname
    return `flex min-h-12 touch-manipulation items-center border-b border-ivory/10 py-3 text-lg ${current ? "text-gold" : "text-ivory"}`
  }

  const panel = (
    <nav
      id={panelId}
      className="fixed inset-0 z-[80] flex flex-col bg-navy text-ivory"
      aria-label="Mobile"
      onClickCapture={onMenuClickCapture}
    >
      <div className="flex items-center justify-end border-b border-ivory/10 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          className="inline-flex min-h-11 touch-manipulation items-center justify-center border border-ivory/40 px-3 text-sm"
          onClick={() => closeMenu(false)}
        >
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {primaryNav.map((item) => (
          <Link key={item.href} href={item.href} aria-current={pathOf(item.href) === pathname ? "page" : undefined} className={itemClass(item.href)}>
            {item.label}
          </Link>
        ))}
        <div className="border-b border-ivory/10 text-lg text-ivory [&_a]:flex [&_a]:min-h-12 [&_a]:w-full [&_a]:touch-manipulation [&_a]:items-center [&_a]:py-3">
          {account}
        </div>
        {more.map((item) => (
          <Link key={item.href} href={item.href} aria-current={pathOf(item.href) === pathname ? "page" : undefined} className={itemClass(item.href)}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex min-h-11 touch-manipulation items-center justify-center border border-ivory/40 px-3 text-sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={openMenu}
      >
        Menu
      </button>
      {open && mounted ? createPortal(panel, document.body) : null}
    </>
  )
}
