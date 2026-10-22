"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { ROTARACT_CLUBS } from "@/domain/clubs"

export function ClubCombobox({
  value,
  error,
  disabled = false,
  onChange,
}: {
  value: string
  error?: string
  disabled?: boolean
  onChange: (club: string) => void
}) {
  const listId = useId()
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (value && value !== query) setQuery(value)
  }, [value, query])
  const [active, setActive] = useState(0)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return [...ROTARACT_CLUBS]
    return ROTARACT_CLUBS.filter((club) => club.toLowerCase().includes(needle))
  }, [query])

  function choose(club: string) {
    onChange(club)
    setQuery(club)
    setOpen(false)
  }

  function move(next: number) {
    if (matches.length === 0) return
    const index = (next + matches.length) % matches.length
    setActive(index)
    optionRefs.current[index]?.scrollIntoView({ block: "nearest" })
  }

  return (
    <div data-field="club" className="relative grid scroll-mt-28 gap-2 text-sm">
      <label htmlFor="club-search" className="text-sm">
        Rotaract club
      </label>
      <input
        id="club-search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        value={query}
        autoComplete="off"
        placeholder="Search the district clubs"
        className={`w-full border bg-paper px-3 py-3 text-base disabled:cursor-not-allowed disabled:bg-ivory ${error ? "border-gold-deep" : "border-line"}`}
        onFocus={() => {
          if (!disabled) setOpen(true)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActive(0)
          if (event.target.value !== value) onChange("")
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setOpen(true)
            move(active + 1)
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            move(active - 1)
          } else if (event.key === "Enter" && open && matches[active]) {
            event.preventDefault()
            choose(matches[active])
          } else if (event.key === "Escape") {
            setOpen(false)
          }
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {error ? (
        <span className="text-xs tracking-wide text-gold-deep" role="alert">
          {error}
        </span>
      ) : null}
      {open ? (
        <ul id={listId} role="listbox" className="absolute top-full z-20 mt-1 max-h-60 w-full overflow-y-auto border border-line bg-paper shadow-sm">
          {matches.length === 0 ? <li className="px-3 py-3 text-sm text-slate">No club matches that search.</li> : null}
          {matches.map((club, index) => (
            <li key={club} role="presentation">
              <button
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={club === value}
                className={`block min-h-11 w-full px-3 py-2 text-left text-base ${index === active ? "bg-ivory" : "bg-paper"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(club)}
              >
                {club}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
