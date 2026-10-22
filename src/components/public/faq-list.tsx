"use client"

import { useMemo, useState } from "react"
import { Accordion } from "@/components/ui/accordion"

export function FaqList({ faqs }: { faqs: { id: string; category: string; question: string; answer: string }[] }) {
  const [query, setQuery] = useState("")
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return faqs
    return faqs.filter((faq) => `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase().includes(needle))
  }, [faqs, query])

  return (
    <div className="grid gap-4">
      <label htmlFor="faq-search" className="text-sm font-medium text-ink">
        Search questions
      </label>
      <input
        id="faq-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="border border-line bg-paper px-3 text-base"
        placeholder="Search"
      />
      {visible.length === 0 ? <p className="text-base text-slate">No question matches that search.</p> : null}
      <Accordion
        label="Questions"
        items={visible.map((faq) => ({
          id: faq.id,
          title: faq.question,
          body: (
            <p>
              <span className="text-xs tracking-[0.14em] text-gold uppercase">{faq.category}</span>
              <span className="mt-2 block">{faq.answer}</span>
            </p>
          ),
        }))}
      />
    </div>
  )
}
